import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layers, Users, Plug } from "lucide-react";
import ToolStack from "@/pages/ToolStack";
import UsageAnalytics from "@/pages/UsageAnalytics";
import InventoryConnections from "@/components/connections/InventoryConnections";

const tabs = [
  { id: "inventory", label: "Inventory", icon: Layers },
  { id: "usage", label: "Usage", icon: Users },
  { id: "connect", label: "Connections", icon: Plug },
];

export default function MyStack() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabs.some(({ id }) => id === requestedTab) ? requestedTab : "inventory");

  const selectTab = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === "inventory" ? {} : { tab });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">My Stack</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your tools, connections, and usage in one place.</p>
      </div>
      <div className="tab-track flex w-fit max-w-full overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => selectTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all active:scale-[0.96] ${activeTab === id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      {activeTab === "inventory" && <ToolStack />}
      {activeTab === "usage" && <UsageAnalytics />}
      {activeTab === "connect" && <InventoryConnections />}
    </div>
  );
}