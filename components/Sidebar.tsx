"use client";

import {
  Home,
  MessageSquare,
  BarChart2,
  Users,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

export function Sidebar() {
  return (
    <div className="w-16 border-r border-gray-200 bg-white p-2 h-screen flex-shrink-0">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-center">
          <Avatar className="h-8 w-8 bg-green-500">
            <span className="text-white text-xs">P</span>
          </Avatar>
        </div>
        <div className="flex flex-col space-y-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-gray-100"
          >
            <Home className="h-5 w-5 text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 bg-gray-100"
          >
            <MessageSquare className="h-5 w-5 text-gray-900" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-gray-100"
          >
            <BarChart2 className="h-5 w-5 text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-gray-100"
          >
            <Users className="h-5 w-5 text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-gray-100"
          >
            <Settings className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}