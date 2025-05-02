import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Check,
  MessageSquare,
  Star,
  ThumbsUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Star rating component
const StarRating = ({ rating, setRating }: { rating: number; setRating: (value: number) => void }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="focus:outline-none"
          onClick={() => setRating(star)}
        >
          <Star
            className={`h-8 w-8 ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const FeedbackPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("review");
  const [rating, setRating] = useState(0);
  
  const [reviewForm, setReviewForm] = useState({
    comment: "",
  });
  
  const [complaintForm, setComplaintForm] = useState({
    title: "",
    description: "",
    urgency: "medium",
  });
  
  const [suggestionForm, setSuggestionForm] = useState({
    title: "",
    description: "",
  });
  
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting your review",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please login to submit feedback",
          variant: "destructive",
        });
        return;
      }
      
      // Prepare feedback data
      const feedbackData = {
        rating: rating,
        comment: reviewForm.comment,
      };
      
      console.log("Submitting feedback:", feedbackData);
      
      // Make API request
      const response = await fetch("http://127.0.0.1:8000/api/feedback/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
        body: JSON.stringify(feedbackData),
      });
      
      let errorData = null;
      try {
        const responseText = await response.text();
        if (responseText) {
          const jsonData = JSON.parse(responseText);
          if (!response.ok) {
            errorData = jsonData;
          } else {
            // Success case
            console.log("Feedback submitted successfully:", jsonData);
            
            toast({
              title: "Thank you for your review!",
              description: `Your ${rating}-star review has been submitted successfully.`,
            });
            
            setRating(0);
            setReviewForm({ comment: "" });
            return;
          }
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        // Continue to throw a generic error below
      }
      
      if (!response.ok) {
        if (errorData && errorData.error) {
          console.error("Feedback submission error:", errorData);
          throw new Error(errorData.error);
        } else {
          throw new Error(`Request failed with status ${response.status}`);
        }
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Submission failed",
        description: error.message || "There was a problem submitting your feedback. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!complaintForm.title || !complaintForm.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please login to submit a complaint",
          variant: "destructive",
        });
        return;
      }
      
      // Prepare complaint data
      const complaintData = {
        title: complaintForm.title,
        description: complaintForm.description,
        urgency: complaintForm.urgency,
      };
      
      console.log("Submitting complaint:", complaintData);
      
      // Make API request
      const response = await fetch("http://127.0.0.1:8000/api/complaints/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
        body: JSON.stringify(complaintData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Complaint submission error:", errorData);
        throw new Error(`Failed to submit complaint: ${JSON.stringify(errorData)}`);
      }
      
      const responseData = await response.json();
      console.log("Complaint submitted successfully:", responseData);
      
      toast({
        title: "Complaint submitted",
        description: "Your complaint has been registered. We'll look into it promptly.",
      });
      
      setComplaintForm({
        title: "",
        description: "",
        urgency: "medium",
      });
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast({
        title: "Submission failed",
        description: error.message || "There was a problem submitting your complaint. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!suggestionForm.title || !suggestionForm.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please login to submit a suggestion",
          variant: "destructive",
        });
        return;
      }
      
      // Prepare suggestion data (stored as a special feedback)
      const suggestionData = {
        rating: 5, // Suggestions are stored with positive rating
        comment: `[SUGGESTION] ${suggestionForm.title}: ${suggestionForm.description}`,
      };
      
      console.log("Submitting suggestion:", suggestionData);
      
      // Make API request using the feedback endpoint
      const response = await fetch("http://127.0.0.1:8000/api/feedback/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
        body: JSON.stringify(suggestionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Suggestion submission error:", errorData);
        throw new Error(`Failed to submit suggestion: ${JSON.stringify(errorData)}`);
      }
      
      const responseData = await response.json();
      console.log("Suggestion submitted successfully:", responseData);
      
      toast({
        title: "Thank you for your suggestion!",
        description: "Your feedback helps us improve our services.",
      });
      
      setSuggestionForm({
        title: "",
        description: "",
      });
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast({
        title: "Submission failed",
        description: error.message || "There was a problem submitting your suggestion. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout isLoggedIn={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Feedback & Suggestions</h1>
          <p className="mt-2 text-gray-600">Share your experience and help us improve</p>
        </div>
        
        <Tabs defaultValue="review" onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="review" className={activeTab === "review" ? "metro-tab-active" : "metro-tab"}>
              <ThumbsUp className="h-4 w-4 mr-2" /> Leave a Review
            </TabsTrigger>
            <TabsTrigger value="complaint" className={activeTab === "complaint" ? "metro-tab-active" : "metro-tab"}>
              <AlertCircle className="h-4 w-4 mr-2" /> File a Complaint
            </TabsTrigger>
            <TabsTrigger value="suggestion" className={activeTab === "suggestion" ? "metro-tab-active" : "metro-tab"}>
              <MessageSquare className="h-4 w-4 mr-2" /> Make a Suggestion
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="review">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Share Your Experience</CardTitle>
                  <CardDescription>
                    Tell us about your journey with Dhaka Metro Rail
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleReviewSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="rating">Your Rating</Label>
                      <StarRating rating={rating} setRating={setRating} />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="comment">Comments (optional)</Label>
                      <Textarea
                        id="comment"
                        placeholder="Share your experience with us..."
                        className="min-h-[120px]"
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ comment: e.target.value })}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" className="bg-metro-green">
                        Submit Review
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Why Your Review Matters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="mt-1 mr-4 rounded-full bg-green-100 p-1">
                        <Check className="h-4 w-4 text-metro-green" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Your feedback helps us improve our services and passenger experience
                      </p>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mt-1 mr-4 rounded-full bg-green-100 p-1">
                        <Check className="h-4 w-4 text-metro-green" />
                      </div>
                      <p className="text-sm text-gray-600">
                        We review all feedback to identify areas for improvement
                      </p>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mt-1 mr-4 rounded-full bg-green-100 p-1">
                        <Check className="h-4 w-4 text-metro-green" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Your constructive criticism helps Dhaka Metro serve you better
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="complaint">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>File a Complaint</CardTitle>
                  <CardDescription>
                    Let us know about any issues you experienced
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleComplaintSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="complaint-title">Subject</Label>
                        <Input
                          id="complaint-title"
                          placeholder="Brief title for your complaint"
                          value={complaintForm.title}
                          onChange={(e) => setComplaintForm({...complaintForm, title: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="urgency">Urgency Level</Label>
                        <Select 
                          value={complaintForm.urgency}
                          onValueChange={(value) => setComplaintForm({...complaintForm, urgency: value})}
                        >
                          <SelectTrigger id="urgency">
                            <SelectValue placeholder="Select urgency level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low - General Feedback</SelectItem>
                            <SelectItem value="medium">Medium - Requires Attention</SelectItem>
                            <SelectItem value="high">High - Urgent Issue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="complaint-description">Description</Label>
                      <Textarea
                        id="complaint-description"
                        placeholder="Please provide detailed information about the issue..."
                        className="min-h-[150px]"
                        value={complaintForm.description}
                        onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" className="bg-metro-green">
                        Submit Complaint
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Complaint Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm text-gray-600">
                    <p>
                      All complaints are reviewed by our customer service team within 24-48 hours.
                    </p>
                    <p>
                      For urgent matters requiring immediate attention, please call our customer 
                      service hotline at +880 1234-567890.
                    </p>
                    <p>
                      Please provide as much detail as possible to help us address your concerns effectively.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="suggestion">
            <Card>
              <CardHeader>
                <CardTitle>Make a Suggestion</CardTitle>
                <CardDescription>
                  Share your ideas on how we can improve our services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSuggestionSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="suggestion-title">Suggestion Title</Label>
                    <Input
                      id="suggestion-title"
                      placeholder="Brief title for your suggestion"
                      value={suggestionForm.title}
                      onChange={(e) => setSuggestionForm({...suggestionForm, title: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="suggestion-description">Description</Label>
                    <Textarea
                      id="suggestion-description"
                      placeholder="Please describe your suggestion in detail..."
                      className="min-h-[150px]"
                      value={suggestionForm.description}
                      onChange={(e) => setSuggestionForm({...suggestionForm, description: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" className="bg-metro-green">
                      Submit Suggestion
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default FeedbackPage;
