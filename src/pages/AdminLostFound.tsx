import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Calendar, 
  Upload, 
  Image as ImageIcon,
  Plus 
} from "lucide-react";
import Layout from "@/components/layout/Layout";

// Types
interface LostItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  date: string;
  status: "claimed" | "unclaimed";
  postedBy?: {
    id: string;
    name: string;
  };
  claimedBy?: {
    id: string;
    name: string;
    date: string;
  };
}

// Image component with fallback
const ImageWithFallback = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
  const [hasError, setHasError] = useState(false);
  
  // Function to get the correct image URL
  const getImageUrl = (url: string): string => {
    if (!url) return "/images/cat.jpg";
    
    // If it's an absolute URL (e.g., https://...)
    if (url.startsWith('http')) return url;
    
    // If it's a local path, make sure it's correct
    if (url.startsWith('/')) return url;
    
    // Otherwise, prepend the correct path
    return `/images/${url}`;
  };
  
  return (
    <img 
      src={hasError ? "/images/cat.jpg" : getImageUrl(src)} 
      className={className} 
      onError={() => setHasError(true)}
      alt={alt}
    />
  );
};

const AdminLostFound: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("items");
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // New item form state
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    location: "",
    imageFile: null as File | null,
    imagePreview: ""
  });

  // Add state for user reports
  const [userReports, setUserReports] = useState<any[]>([]);
  const [isReportsLoading, setIsReportsLoading] = useState(false);

  // Add available images from public/images
  const availableImages = [
    "/images/purse.jpg",
    "/images/Screenshot 2025-05-02 213845.jpg.png",
    "/images/cat.jpg",
    "/images/dhaka-metro-rail.jpg"
  ];

  // Add state for selected public image
  const [selectedPublicImage, setSelectedPublicImage] = useState<string>("");

  // Check if user is logged in and is admin
  useEffect(() => {
    console.log("AdminLostFound component loaded");
    const userDataStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    console.log("Token exists:", !!token);
    console.log("User data exists:", !!userDataStr);
    
    if (!userDataStr || !token) {
      console.error("Missing user data or token");
      toast.error("Please login to access admin panel");
      navigate("/login");
      return;
    }

    try {
      const parsedUserData = JSON.parse(userDataStr);
      console.log("User data:", parsedUserData);
      console.log("Is admin flag:", parsedUserData.isAdmin);
      
      setUserData({
        ...parsedUserData,
        token: token // Store token in userData for easy access
      });
      
      // Check if user is admin
      if (!parsedUserData.isAdmin) {
        console.error("User is not an admin:", parsedUserData);
        toast.error("You do not have permission to access the admin panel");
        navigate("/dashboard");
        return;
      }
      
      setIsAdmin(true);
      console.log("Admin status verified");
    } catch (error) {
      console.error("Error parsing user data:", error);
      toast.error("Error loading user data");
      navigate("/login");
    }
  }, [navigate]);

  // Fetch all lost items
  useEffect(() => {
    if (!userData || !isAdmin) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch lost items from the API
        const response = await fetch("http://127.0.0.1:8000/api/lost-items/");
        if (!response.ok) {
          throw new Error("Failed to fetch lost items");
        }
        
        const data = await response.json();
        const formattedItems: LostItem[] = data.map((item: any) => ({
          id: item.id.toString(),
          title: item.title,
          description: item.description,
          location: item.location,
          imageUrl: item.image_url || "https://placehold.co/400x300?text=No+Image",
          status: item.status.toLowerCase(),
          date: item.date || new Date().toISOString(),
          postedBy: {
            id: item.posted_by,
            name: item.posted_by_name || "Admin User"
          }
        }));
        
        setLostItems(formattedItems);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching lost items:", error);
        toast.error("Failed to load lost & found items");
        // Fallback to mock data in case of error
        // [Keep the mock data as fallback]
        setTimeout(() => {
          const mockLostItems: LostItem[] = [
            {
              id: "L001",
              title: "Black Leather Wallet",
              description: "Leather wallet with ID card and bank cards",
              location: "Uttara North Station",
              imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=2787&auto=format&fit=crop",
              status: "unclaimed",
              date: "2023-04-10T14:30:00",
              postedBy: {
                id: "admin1",
                name: "Admin User"
              }
            },
            {
              id: "L002",
              title: "Blue Smartphone",
              description: "Samsung Galaxy S22 with cracked screen",
              location: "Agargaon Station",
              imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=2727&auto=format&fit=crop",
              status: "unclaimed",
              date: "2023-04-08T09:15:00",
              postedBy: {
                id: "admin2",
                name: "Station Manager"
              }
            },
            {
              id: "L003",
              title: "Red Backpack",
              description: "Adidas backpack with textbooks inside",
              location: "Motijheel Station",
              imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=2787&auto=format&fit=crop",
              status: "claimed",
              date: "2023-04-05T16:45:00",
              postedBy: {
                id: "admin1",
                name: "Admin User"
              },
              claimedBy: {
                id: "user1",
                name: "Rahim Ahmed",
                date: "2023-04-07T10:30:00"
              }
            },
            {
              id: "L004",
              title: "Prescription Glasses",
              description: "Black frame glasses in brown case",
              location: "Farmgate Station",
              imageUrl: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?q=80&w=2787&auto=format&fit=crop",
              status: "unclaimed",
              date: "2023-04-01T12:20:00",
              postedBy: {
                id: "admin3",
                name: "Security Staff"
              }
            },
          ];
          setLostItems(mockLostItems);
          setIsLoading(false);
        }, 1000);
      }
    };

    fetchData();
  }, [userData, isAdmin]);

  // Filter lost items based on search term and status
  const filteredItems = lostItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Format date string
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP p");
  };

  // Handle status change for an item
  const handleStatusChange = (itemId: string, newStatus: string) => {
    setLostItems(
      lostItems.map((item) =>
        item.id === itemId ? { ...item, status: newStatus as "claimed" | "unclaimed" } : item
      )
    );
    toast.success(`Item status changed to ${newStatus}`);
  };

  // Export to CSV
  const exportToCSV = () => {
    let csvContent = "ID,Title,Description,Location,Date,Status\n";
    
    filteredItems.forEach((item) => {
      csvContent += `${item.id},${item.title},"${item.description}",${item.location},${item.date},${item.status}\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lost-items-${new Date().toISOString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle viewing item details
  const viewItemDetails = (item: LostItem) => {
    setSelectedItem(item);
    setIsDetailsDialogOpen(true);
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imagePreview = URL.createObjectURL(file);
      setNewItem({
        ...newItem,
        imageFile: file,
        imagePreview: imagePreview
      });
      setSelectedPublicImage(""); // Clear public image selection
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewItem({
      ...newItem,
      [name]: value
    });
  };

  // Update handleSubmit with more detailed error handling and logging
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submission started");
    
    if (!newItem.title || !newItem.location) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token);
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        navigate("/login");
        return;
      }
      
      const formData = new FormData();
      formData.append("title", newItem.title);
      formData.append("description", newItem.description || "");
      formData.append("location", newItem.location);
      formData.append("status", "unclaimed"); // Add the status field
      
      // Handle image selection
      if (newItem.imageFile) {
        console.log("Adding image file to form data", newItem.imageFile.name);
        formData.append("image_file", newItem.imageFile);
      } else if (selectedPublicImage) {
        console.log("Using selected public image", selectedPublicImage);
        formData.append("image_path", selectedPublicImage);
      } else {
        console.log("No image selected, using default");
        formData.append("image_path", "/images/cat.jpg");
      }
      
      console.log("Sending form data to API");
      
      // Log form data for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      const response = await fetch("http://127.0.0.1:8000/api/lost-items/", {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(`Error: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      console.log("API Response:", data);
      
      toast.success("Item added successfully!");
      setNewItem({
        title: "",
        description: "",
        location: "",
        imageFile: null,
        imagePreview: null,
      });
      setSelectedPublicImage("");
      setIsAddDialogOpen(false);
      
      // Refresh the lost items list
      setLostItems(prev => [data, ...prev]);
      
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error(`Failed to add item: ${error.message}`);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "claimed") {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Claimed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-blue-500 border-blue-500">
        <XCircle className="w-3 h-3 mr-1" />
        Unclaimed
      </Badge>
    );
  };

  // Fetch user reports when the reports tab is active
  useEffect(() => {
    if (activeTab === "reports" && userData && isAdmin) {
      console.log("Fetching user reports for admin...");
      setIsReportsLoading(true);
      
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found for API request");
        toast.error("Authentication token not found");
        setIsReportsLoading(false);
        return;
      }
      
      // First, try the debug endpoint to check if reports exist
      fetch("http://127.0.0.1:8000/api/lost-reports/debug_reports/", {
        headers: {
          "Authorization": `Token ${token}`,
        },
      })
        .then(res => {
          if (!res.ok) throw new Error(`Debug API returned ${res.status}`);
          return res.json();
        })
        .then(debugData => {
          console.log("Debug data:", debugData);
          // Now fetch the actual reports
          return fetch("http://127.0.0.1:8000/api/lost-reports/", {
            headers: {
              "Authorization": `Token ${token}`,
            },
          });
        })
        .then(res => {
          if (!res.ok) throw new Error(`API returned ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log("User reports data:", data);
          setUserReports(data);
        })
        .catch(error => {
          console.error("Error fetching user reports:", error);
          toast.error("Failed to load user reports");
          // If we can't load real data, use fallback data for development
          setUserReports([
            {
              id: "1",
              title: "Lost Laptop",
              description: "I lost my MacBook Pro on the train",
              contact: "01799123456",
              user: {
                id: "user1",
                name: "Ahmed Karim",
                email: "ahmed@example.com"
              },
              submitted_at: new Date().toISOString()
            },
            {
              id: "2",
              title: "Missing Bag",
              description: "Left my backpack at Motijheel station",
              contact: "01612345678",
              user: {
                id: "user2",
                name: "Fatima Rahman",
                email: "fatima@example.com"
              },
              submitted_at: new Date(Date.now() - 86400000).toISOString()
            }
          ]);
        })
        .finally(() => {
          setIsReportsLoading(false);
        });
    }
  }, [activeTab, userData, isAdmin]);

  // Loading state
  if (isLoading) {
    return (
      <Layout isLoggedIn={true}>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              <CardDescription>Loading lost & found data...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isLoggedIn={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lost & Found Management</h1>
            <p className="mt-2 text-gray-600">Manage lost items and post new found items</p>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-metro-green"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Found Item
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <TabsList className="grid w-full md:w-auto grid-cols-2">
              <TabsTrigger value="items">Lost Items</TabsTrigger>
              <TabsTrigger value="reports">User Reports</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search items..."
                  className="pl-9 w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="unclaimed">Unclaimed</SelectItem>
                  <SelectItem value="claimed">Claimed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={exportToCSV}
                disabled={filteredItems.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          <TabsContent value="items" className="space-y-6">
            <Card>
              <CardContent className="p-0">
                {filteredItems.length > 0 ? (
                  <Table>
                    <TableCaption>
                      List of {statusFilter === "all" ? "all" : statusFilter} lost items
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Date Found</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="h-12 w-12 rounded-md overflow-hidden">
                              <ImageWithFallback 
                                src={item.imageUrl || ""} 
                                alt={item.title} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                              {item.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                              {formatDate(item.date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={item.status} />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => viewItemDetails(item)}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {item.status === "unclaimed" ? (
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, "claimed")}>
                                    Mark as Claimed
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, "unclaimed")}>
                                    Mark as Unclaimed
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No lost items found matching your criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">User Lost Item Reports</h3>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const token = localStorage.getItem("token");
                      if (!token) {
                        toast.error("Authentication token not found");
                        return;
                      }
                      
                      fetch("http://127.0.0.1:8000/api/lost-reports/create_samples/", {
                        method: "POST",
                        headers: {
                          "Authorization": `Token ${token}`,
                        },
                      })
                        .then(res => {
                          if (!res.ok) throw new Error(`API returned ${res.status}`);
                          return res.json();
                        })
                        .then(data => {
                          console.log("Sample reports created:", data);
                          toast.success(`Created ${data.reports.length} sample reports`);
                          
                          // Refresh the reports
                          setActiveTab("items"); // Switch away from reports tab
                          setTimeout(() => setActiveTab("reports"), 100); // Switch back to trigger the useEffect
                        })
                        .catch(error => {
                          console.error("Error creating sample reports:", error);
                          toast.error("Failed to create sample reports");
                        });
                    }}
                    size="sm"
                  >
                    Create Sample Reports
                  </Button>
                </div>
                
                {isReportsLoading ? (
                  <div className="text-center py-12">Loading...</div>
                ) : userReports.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No user lost item reports found.</p>
                    <p className="text-sm mt-2">Users can report lost items from the Lost & Found page.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userReports.map(report => (
                        <TableRow key={report.id}>
                          <TableCell>{report.title}</TableCell>
                          <TableCell className="max-w-xs truncate">{report.description}</TableCell>
                          <TableCell>{report.contact}</TableCell>
                          <TableCell>
                            {report.user_name || (typeof report.user === 'object' 
                              ? report.user.name || report.user.email 
                              : `User ID: ${report.user}`)}
                            {report.user_email && <div className="text-xs text-gray-500">{report.user_email}</div>}
                            {!report.user_name && !report.user_email && typeof report.user === 'object' && report.user.email && 
                              <div className="text-xs text-gray-500">{report.user.email}</div>}
                          </TableCell>
                          <TableCell>{new Date(report.submitted_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Details Dialog */}
      <Dialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      >
        <DialogContent className="max-w-md">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.title}</DialogTitle>
                <DialogDescription>
                  Item details and information
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                <div className="h-48 w-full rounded-md overflow-hidden mb-4">
                  <ImageWithFallback 
                    src={selectedItem.imageUrl || ""} 
                    alt={selectedItem.title} 
                    className="h-full w-full object-cover"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Location</Label>
                    <p className="font-medium">{selectedItem.location}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-500">Date Found</Label>
                    <p className="font-medium">{formatDate(selectedItem.date)}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-500">Status</Label>
                    <div className="mt-1">
                      <StatusBadge status={selectedItem.status} />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-500">Posted By</Label>
                    <p className="font-medium">{selectedItem.postedBy?.name || "N/A"}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-500">Description</Label>
                  <p className="mt-1">{selectedItem.description}</p>
                </div>
                
                {selectedItem.status === "claimed" && selectedItem.claimedBy && (
                  <div className="border-t pt-3 mt-3">
                    <Label className="text-sm text-gray-500">Claimed By</Label>
                    <p className="font-medium">{selectedItem.claimedBy.name}</p>
                    <p className="text-sm text-gray-500">
                      on {formatDate(selectedItem.claimedBy.date)}
                    </p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailsDialogOpen(false)}
                >
                  Close
                </Button>
                
                {selectedItem.status === "unclaimed" ? (
                  <Button 
                    onClick={() => {
                      handleStatusChange(selectedItem.id, "claimed");
                      setIsDetailsDialogOpen(false);
                    }}
                  >
                    Mark as Claimed
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      handleStatusChange(selectedItem.id, "unclaimed");
                      setIsDetailsDialogOpen(false);
                    }}
                  >
                    Mark as Unclaimed
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add New Item Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Found Item</DialogTitle>
            <DialogDescription>
              Enter the details of the item found in the metro station
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Item Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Black Wallet, Blue Backpack"
                value={newItem.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location Found</Label>
              <Input
                id="location"
                name="location"
                placeholder="e.g., Uttara North Station, Train Car #5"
                value={newItem.location}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Item Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detailed description of the item..."
                className="min-h-[80px]"
                value={newItem.description}
                onChange={handleInputChange}
                required
              />
            </div>
            
            {/* Upload image section */}
            <div className="space-y-2">
              <Label htmlFor="image">Upload Image</Label>
              <div className="mt-1 flex items-center gap-2">
                <label className="block">
                  <span className="sr-only">Choose image</span>
                  <input 
                    id="image"
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => document.getElementById('image')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                </label>
                {newItem.imageFile && (
                  <span className="text-sm text-gray-500 self-center ml-2">
                    {newItem.imageFile.name}
                  </span>
                )}
              </div>
            </div>
            
            {/* Image gallery section */}
            <div className="space-y-2">
              <Label>Select Image from Gallery</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {availableImages.map((imgPath) => (
                  <div 
                    key={imgPath}
                    onClick={() => {
                      setSelectedPublicImage(imgPath);
                      // Clear uploaded file when selecting from gallery
                      setNewItem({
                        ...newItem,
                        imageFile: null,
                        imagePreview: imgPath
                      });
                    }}
                    className={`
                      relative cursor-pointer overflow-hidden rounded-md border h-24
                      ${selectedPublicImage === imgPath ? 'ring-2 ring-metro-green ring-offset-2' : 'hover:opacity-80'}
                    `}
                  >
                    <img 
                      src={imgPath} 
                      alt="Gallery option" 
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Preview section */}
            <div className="space-y-2 mt-4">
              <Label>Selected Image Preview</Label>
              <div className="mt-2 border rounded-md p-2 h-48 flex items-center justify-center bg-gray-50">
                {newItem.imagePreview ? (
                  <img 
                    src={newItem.imagePreview} 
                    alt="Preview" 
                    className="max-h-full max-w-full object-contain"
                  />
                ) : selectedPublicImage ? (
                  <img 
                    src={selectedPublicImage} 
                    alt="Preview" 
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <p>No image selected</p>
                    <p className="text-xs">Upload an image or select from gallery</p>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminLostFound; 