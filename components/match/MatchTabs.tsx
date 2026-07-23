"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export interface MatchTabDef {
  value: string;
  label: string;
  content: React.ReactNode;
}

export function MatchTabs({
  tabs,
  defaultValue,
}: {
  tabs: MatchTabDef[];
  defaultValue: string;
}) {
  return (
    <Tabs defaultValue={defaultValue} className="flex min-w-0 flex-col gap-4">
      <div className="overflow-x-auto">
        <TabsList className="h-12">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="px-4 text-sm sm:text-base">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
