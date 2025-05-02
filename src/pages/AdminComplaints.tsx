import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  AlertTriangle, 
  Calendar 
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define urgency badge colors
const urgencyColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800"
};

// Status badge colors
const statusColors = {
  open: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800"
};

// Types
interface UserComplaint {
  id: string;
  title: string;
  description: string;
  urgency: "low" | "medium" | "high";
  status: "open" | "closed";
  user: {
    id: string;
    name: string;
    email?: string;
  };
  submitted_at: string;
}

const AdminComplaints: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [complaints, setComplaints] = useState<UserComplaint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedComplaint, setSelectedComplaint] = useState<UserComplaint | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Check if user is logged in and is admin
  useEffect(() => {
    const userDataStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    if (!userDataStr || !token) {
      toast.error("Please login to access admin panel");
      navigate("/login");
      return;
    }

    try {
      const parsedUserData = JSON.parse(userDataStr);
      
      // Check if user is admin
      if (!parsedUserData.isAdmin) {
        toast.error("You do not have permission to access the admin panel");
        navigate("/dashboard");
        return;
      }
      
      // User is admin, proceed with loading data
      fetchComplaints();
    } catch (error) {
      console.error("Error parsing user data:", error);
      toast.error("Error loading user data");
      navigate("/login");
    }
  }, [navigate]);

  // Fetch all complaints
  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Fetch complaints from the API
      const response = await fetch("http://127.0.0.1:8000/api/complaints/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch complaints");
      }
      
      const data = await response.json();
      console.log("Complaints data:", data);
      
      // Transform data to match our interface
      const formattedComplaints: UserComplaint[] = data.map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        description: item.description || "",
        urgency: item.urgency || "medium",
        status: item.status || "open",
        user: {
          id: item.user.toString(),
          name: item.user_name || "Unknown User",
          email: item.user_email || "",
        },
        submitted_at: item.submitted_at,
      }));
      
      setComplaints(formattedComplaints);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast.error("Failed to load complaints");
      
      // Fallback data for development
      setComplaints([
        {
          id: "1",
          title: "Trains are consistently late",
          description: "The trains at Uttara North station have been 10-15 minutes late every morning this week.",
          urgency: "medium",
          status: "open",
          user: {
            id: "user1",
            name: "Karim Ahmed",
            email: "karim@example.com",
          },
          submitted_at: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Ticket machines not working",
          description: "All ticket machines at Agargaon station are out of order.",
          urgency: "high",
          status: "open",
          user: {
            id: "user2",
            name: "Fatima Rahman",
            email: "fatima@example.com",
          },
          submitted_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
        {
          id: "3",
          title: "Poor lighting in station",
          description: "The lighting at Motijheel station is very dim, especially in the evening. This is a safety concern.",
          urgency: "low",
          status: "closed",
          user: {
            id: "user3",
            name: "Mohammed Ali",
            email: "mohammed@example.com",
          },
          submitted_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP p");
  };

  // Filter complaints based on search term, urgency, and status
  const filteredComplaints = complaints.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUrgency =
      urgencyFilter === "all" || item.urgency === urgencyFilter;
      
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesUrgency && matchesStatus;
  });

  // Handle viewing complaint details
  const viewComplaintDetail = (complaint: UserComplaint) => {
    setSelectedComplaint(complaint);
    setIsDetailDialogOpen(true);
  };

  // Handle status change
  const handleStatusChange = async (complaintId: string, newStatus: "open" | "closed") => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }
      
      // Make API request to update complaint status
      const response = await fetch(`http://127.0.0.1:8000/api/complaints/${complaintId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update status: ${response.status}`);
      }
      
      // Update local state after successful API call
      setComplaints(complaints.map(complaint => 
        complaint.id === complaintId 
          ? { ...complaint, status: newStatus } 
          : complaint
      ));
      
      toast.success(`Complaint status updated to ${newStatus}`);
      
      // If dialog is open, update selected complaint
      if (selectedComplaint && selectedComplaint.id === complaintId) {
        setSelectedComplaint({
          ...selectedComplaint,
          status: newStatus
        });
      }
    } catch (error) {
      console.error("Error updating complaint status:", error);
      toast.error(error.message || "Failed to update complaint status");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    let csvContent = "ID,Title,Description,Urgency,Status,User,Email,Date\n";
    
    filteredComplaints.forEach((item) => {
      // Sanitize description for CSV (escape commas and quotes)
      const sanitizedDescription = item.description.replace(/"/g, '""');
      
      csvContent += `${item.id},"${item.title}","${sanitizedDescription}",${item.urgency},${item.status},"${item.user.name}","${item.user.email || ""}","${item.submitted_at}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `complaints-${new Date().toISOString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout isLoggedIn={true}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Complaints</h1>
              <p className="mt-2 text-gray-600">Loading complaints...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isLoggedIn={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Complaints</h1>
            <p className="mt-2 text-gray-600">Manage and respond to customer complaints</p>
          </div>
          <div>
            <Link to="/admin/feedback">
              <Button variant="outline" className="mr-2">
                <span className="mr-2">View All Feedback</span>
              </Button>
            </Link>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search complaints by title, content, or user..."
                  className="pl-9 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="text-gray-400" size={16} />
                  <Select
                    value={urgencyFilter}
                    onValueChange={setUrgencyFilter}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter by urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Urgencies</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="text-gray-400" size={16} />
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  disabled={filteredComplaints.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {filteredComplaints.length > 0 ? (
              <Table>
                <TableCaption>
                  List of user complaints
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.user.name}</TableCell>
                      <TableCell>
                        <Badge className={urgencyColors[item.urgency]}>
                          {item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[item.status]}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(item.submitted_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => viewComplaintDetail(item)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {item.status === "open" ? (
                              <DropdownMenuItem onClick={() => handleStatusChange(item.id, "closed")}>
                                Mark as Resolved
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleStatusChange(item.id, "open")}>
                                Reopen Complaint
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
                <p className="text-gray-500">No complaints found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Complaint Detail Dialog */}
      <Dialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      >
        <DialogContent className="max-w-md">
          {selectedComplaint && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle>{selectedComplaint.title}</DialogTitle>
                  <Badge className={urgencyColors[selectedComplaint.urgency]}>
                    {selectedComplaint.urgency.charAt(0).toUpperCase() + selectedComplaint.urgency.slice(1)}
                  </Badge>
                </div>
                <DialogDescription>
                  Complaint details
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                <div>
                  <p className="text-sm text-gray-500">Submitted By</p>
                  <p className="font-medium">{selectedComplaint.user.name}</p>
                  {selectedComplaint.user.email && (
                    <p className="text-sm text-gray-500">{selectedComplaint.user.email}</p>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={statusColors[selectedComplaint.status]}>
                    {selectedComplaint.status.charAt(0).toUpperCase() + selectedComplaint.status.slice(1)}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Submitted On</p>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    {formatDate(selectedComplaint.submitted_at)}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="mt-1 border rounded p-3 bg-gray-50">{selectedComplaint.description}</p>
                </div>
              </div>
              
              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  Close
                </Button>
                
                {selectedComplaint.status === "open" ? (
                  <Button 
                    variant="default"
                    onClick={() => {
                      handleStatusChange(selectedComplaint.id, "closed");
                    }}
                  >
                    Mark as Resolved
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      handleStatusChange(selectedComplaint.id, "open");
                    }}
                  >
                    Reopen Complaint
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminComplaints; 