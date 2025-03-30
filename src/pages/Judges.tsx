
import React from "react";
import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Circle, ExternalLink, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

const Judges = () => {
  const trackName = "Startup 🚀";

  const checklistCategories = [
    {
      title: "Track your submission progress",
      items: [
        { label: "Your track:", value: trackName, isHeader: true },
        { label: "Project Link", isCompleted: true },
        { label: "Published project ready for submission", isCompleted: true },
        { label: "Project is publicly accessible", isCompleted: true },
        { label: "URL ends with lovable.app", isCompleted: true },
      ],
    },
    {
      title: "Video Demo",
      items: [
        { label: "Video demo created", isCompleted: true },
        { label: "Video is 60 seconds or less", isCompleted: true },
        { label: "Demonstrates core value proposition", isCompleted: true },
        { label: "Highlights technology integrations used", isCompleted: true },
      ],
    },
    {
      title: "Project Overview",
      items: [
        { label: "Clear project title", isCompleted: true },
        { label: "Concise, memorable tagline", isCompleted: false },
        { label: "Defined target audience", isCompleted: true },
        { label: "List of how track requirements are met", isCompleted: false },
        { label: "Team information and contributions included", isCompleted: false },
        { label: "Competition track specified", isCompleted: true },
      ],
    },
    {
      title: "Track-Specific Requirements",
      subtitle: `Current track: ${trackName}`,
      items: [
        { label: "Problem statement (what issue is being solved)", isCompleted: false },
        { label: "Solution description (how the product solves the problem)", isCompleted: false },
        { label: "Business model (how this could become viable)", isCompleted: false },
        { label: "Market opportunity (size and potential)", isCompleted: false },
      ],
    },
    {
      title: "Screenshots & Technical Implementation",
      items: [
        { label: "At least 3 high-quality screenshots included", isCompleted: false },
        { label: "Screenshots highlight UI and key features", isCompleted: false },
        { label: "Required integrations implementation described", isCompleted: false },
        { label: "Sponsor technologies usage explained", isCompleted: false },
      ],
    },
  ];

  return (
    <MainLayout title="Judges View">
      <div className="container mx-auto py-8">
        <div className="mb-6 max-w-3xl">
          <p className="text-gray-600 mb-4">
            Use this page to track your progress on competition requirements and prepare your submission for judges. 
            Check off items as you complete them to ensure you've covered all the necessary components.
          </p>
          <div className="flex space-x-4">
            <Button className="bg-collector-purple hover:bg-purple-700">
              <Link to="/dashboard" className="flex items-center">
                Back to Dashboard
              </Link>
            </Button>
            <Button className="bg-collector-cyan hover:bg-cyan-700 animate-pulse-subtle">
              <Link to="/video-demo" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                View Video Demo
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl">
          {checklistCategories.map((category, index) => (
            <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2 bg-gradient-to-r from-collector-purple/10 to-collector-cyan/10">
                <CardTitle className="text-xl font-bold text-collector-purple">
                  {category.title}
                </CardTitle>
                {category.subtitle && (
                  <p className="text-sm text-gray-600">{category.subtitle}</p>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className={`flex items-start gap-2 ${item.isHeader ? 'mb-2' : ''}`}>
                      {!item.isHeader ? (
                        <>
                          {item.isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300 mt-0.5 flex-shrink-0" />
                          )}
                          <span className={item.isCompleted ? "text-gray-700" : "text-gray-500"}>
                            {item.label}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center space-x-2 font-medium text-collector-navy">
                          <span>{item.label}</span>
                          <span>{item.value}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 max-w-6xl bg-collector-pastel-blue p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-collector-navy mb-2 flex items-center">
            <ExternalLink className="mr-2 h-5 w-5" />
            Helpful Resources
          </h3>
          <Separator className="mb-4" />
          <ul className="space-y-2">
            <li>
              <a 
                href="https://docs.lovable.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-collector-cyan hover:text-collector-purple flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Lovable Documentation
              </a>
            </li>
            <li>
              <a 
                href="https://discord.com/channels/1119885301872070706/1280461670979993613" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-collector-cyan hover:text-collector-purple flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Lovable Discord Community
              </a>
            </li>
            <li>
              <a 
                href="https://www.youtube.com/watch?v=9KHLTZaJcR8&list=PLbVHz4urQBZkJiAWdG8HWoJTdgEysigIO" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-collector-cyan hover:text-collector-purple flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Lovable YouTube Tutorials
              </a>
            </li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default Judges;
