import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/config";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Clock, Search, ArrowRight, ListFilter, Layers } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { motion } from "motion/react";

interface Bounty {
    id: number;
    title: string;
    description: string;
    reward: string;
    deadline: string;
    deadline_str?: string;
    status: "open" | "in_progress" | "completed" | "disputed";
    requirements: string[];
    category: string;
    postedAgo: string;
}

const statusConfig = {
  open: { variant: "default" as const, label: "Open" },
  in_progress: { variant: "warning" as const, label: "In Progress" },
  completed: { variant: "success" as const, label: "Completed" },
  disputed: { variant: "danger" as const, label: "Disputed" },
};

const filters = ["All", "Open", "In Progress", "Completed", "Disputed"];

export function BountyListings() {
  const [searchParams] = useSearchParams();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get("filter") || "All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/bounties`)
      .then(res => res.json())
      .then(data => {
         // data is the array itself or {bounties: []}
         setBounties(data.bounties || data || []);
         setIsLoading(false);
      })
      .catch(err => {
         console.error(err);
         setIsLoading(false);
      });
  }, []);

  useEffect(() => {
      const filter = searchParams.get("filter");
      if (filter) setSelectedStatus(filter);
  }, [searchParams]);

  const filteredBounties = bounties.filter((bounty) => {
    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Open" && bounty.status === "open") ||
      (selectedStatus === "In Progress" && bounty.status === "in_progress") ||
      (selectedStatus === "Completed" && bounty.status === "completed") ||
      (selectedStatus === "Disputed" && bounty.status === "disputed");
    const matchesSearch = bounty.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalAlgo = filteredBounties.reduce(
    (sum, b) => sum + parseFloat(b.reward || "0"),
    0
  );

  if (isLoading) {
      return (
          <div className="p-6 md:p-8 max-w-5xl mx-auto text-center">
              <p className="text-[#4B4B4B] mt-10">Loading Bounties from Blockchain...</p>
          </div>
      );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[#1F1F1F] mb-1">Bounty Listings</h1>
          <p className="text-sm text-[#4B4B4B]">Browse and apply for available work</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5E5] rounded-xl">
          <Layers className="w-4 h-4 text-[#CFCFCF]" />
          <span className="text-sm text-[#4B4B4B]">
            {filteredBounties.length} bounties
          </span>
          <span className="text-[#E5E5E5]">·</span>
          <span className="text-sm text-[#4B4B4B]">
            {totalAlgo.toLocaleString()} ALGO
          </span>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#CFCFCF]" />
          <input
            type="text"
            placeholder="Search bounties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#1F1F1F] placeholder:text-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-[#CFCFCF]" />
          <div className="flex gap-1.5 flex-wrap">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedStatus(filter)}
                className={`px-3.5 py-2 rounded-xl text-sm transition-all duration-150 ${
                  selectedStatus === filter
                    ? "bg-[#1F1F1F] text-white"
                    : "bg-white border border-[#E5E5E5] text-[#4B4B4B] hover:bg-[#F5F5F5]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bounty Cards */}
      <div className="space-y-3">
        {filteredBounties.map((bounty, i) => (
          <motion.div
            key={bounty.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
          >
            <Link to={bounty.status === 'disputed' ? `/app/disputes/${bounty.id}` : `/app/bounties/${bounty.id}`}>
              <Card hover className="group">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Left: content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h3 className="text-[#1F1F1F]">{bounty.title}</h3>
                          <span className="px-2 py-0.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-full text-xs text-[#4B4B4B]">
                            {bounty.category}
                          </span>
                        </div>
                        <p className="text-sm text-[#4B4B4B] leading-relaxed line-clamp-2">
                          {bounty.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#CFCFCF] mt-3">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {bounty.deadline}
                      </span>
                      <span>{(bounty.requirements || []).length} requirements</span>
                      <span>Posted {bounty.postedAgo}</span>
                    </div>
                  </div>

                  {/* Right: reward + status */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 lg:gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p
                        className="text-[#1F1F1F]"
                        style={{ fontSize: "22px", fontWeight: 700, lineHeight: 1 }}
                      >
                        {parseFloat(bounty.reward || "0").toLocaleString()}
                      </p>
                      <p className="text-xs text-[#CFCFCF] mt-0.5">ALGO</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusConfig[bounty.status]?.variant || "default"}>
                        {statusConfig[bounty.status]?.label || "Unknown"}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-[#CFCFCF] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {filteredBounties.length === 0 && (
        <div className="py-16 text-center">
          <div className="w-12 h-12 bg-[#F5F5F5] border border-[#E5E5E5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-5 h-5 text-[#CFCFCF]" />
          </div>
          <p className="text-sm text-[#4B4B4B] mb-1">No bounties found</p>
          <p className="text-xs text-[#CFCFCF]">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
