
import React from "react";
import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, Play, Sparkles, Star, Workflow, ShieldCheck, Clock, Package } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const VideoDemo = () => {
  const technologies = [
    { 
      name: "Lovable",
      description: "AI-powered web app development platform",
      icon: <Sparkles className="h-5 w-5 text-collector-purple" /> 
    },
    { 
      name: "ElevenLabs",
      description: "Advanced voice synthesis and AI voice assistants",
      icon: <Play className="h-5 w-5 text-collector-cyan" /> 
    },
    { 
      name: "Anthropic",
      description: "Cutting-edge AI language models for content generation",
      icon: <Star className="h-5 w-5 text-indigo-400" /> 
    },
    { 
      name: "Google Vision AI",
      description: "Object detection and image recognition",
      icon: <Workflow className="h-5 w-5 text-blue-500" /> 
    },
    { 
      name: "Gemini 2.5",
      description: "Multimodal AI for text and image understanding",
      icon: <Sparkles className="h-5 w-5 text-emerald-500" /> 
    }
  ];

  return (
    <MainLayout title="Video Demo Showcase">
      <div className="container mx-auto py-8">
        <Button variant="outline" className="mb-6">
          <Link to="/judges" className="flex items-center gap-2">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Judges View
          </Link>
        </Button>

        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="md:col-span-3">
            <Card className="overflow-hidden shadow-lg border-collector-purple/20">
              <div className="aspect-video bg-gradient-to-br from-collector-purple/10 to-collector-cyan/10 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-collector-purple/20 mb-4">
                    <Play className="h-10 w-10 text-collector-purple" />
                  </div>
                  <p className="text-gray-600">
                    Video placeholder - Your 20-second demo would appear here
                  </p>
                </div>
              </div>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-collector-purple to-collector-cyan bg-clip-text text-transparent mb-2">
                  The Collectors Portal: Protecting What Matters Most
                </h2>
                <p className="text-gray-600 mb-4">
                  This 20-second video demonstrates how The Collectors Portal revolutionizes how hobbyists track, manage, and protect their valuable collections.
                </p>
                <div className="flex items-center gap-2 text-collector-navy">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">20-second showcase</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="h-full shadow-lg border-collector-purple/20">
              <CardHeader className="bg-gradient-to-r from-collector-purple/10 to-collector-cyan/10">
                <CardTitle className="text-xl text-collector-purple">Core Value Proposition</CardTitle>
                <CardDescription>What makes our solution unique</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-collector-pastel-purple flex items-center justify-center">
                      <Package className="h-5 w-5 text-collector-purple" />
                    </div>
                    <div>
                      <h3 className="font-medium text-collector-navy">Simplified Collection Management</h3>
                      <p className="text-sm text-gray-600">Complete digital inventory system with image recognition for easy item cataloging</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-collector-pastel-blue flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-collector-cyan" />
                    </div>
                    <div>
                      <h3 className="font-medium text-collector-navy">Insurance-Ready Documentation</h3>
                      <p className="text-sm text-gray-600">Comprehensive item details and valuation for insurance claims and inventory protection</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Workflow className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-collector-navy">AI-Powered Assistance</h3>
                      <p className="text-sm text-gray-600">Voice assistant and intelligent item recognition for effortless collection management</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-collector-navy mb-6">Technologies Used</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          {technologies.map((tech, index) => (
            <Card key={index} className="border-collector-purple/10 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    {tech.icon}
                  </div>
                  <h3 className="font-semibold text-collector-navy mb-2">{tech.name}</h3>
                  <p className="text-sm text-gray-600">{tech.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="max-w-3xl mx-auto border-collector-purple/20">
          <CardHeader className="bg-gradient-to-r from-collector-purple/10 to-collector-cyan/10">
            <CardTitle>About The Collectors Portal</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-4">
              The Collectors Portal was built for collector hobbyists to revolutionize how they track, manage, and safeguard their valuable collections. Our platform provides an intuitive inventory system that ensures collections are properly documented for insurance purposes and personal records.
            </p>
            <p className="text-gray-600 mb-4">
              Using cutting-edge AI technologies, we've created a seamless experience that makes cataloging, valuing, and protecting collections easier than ever before.
            </p>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Made with ❤️ using Lovable</span>
              <Button variant="outline" size="sm">
                <Link to="/judges">Return to Submission Checklist</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default VideoDemo;
