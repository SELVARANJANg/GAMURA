import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  Users,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Compass,
  RotateCcw,
  ArrowLeft,
  Activity,
} from "lucide-react";
import { collection, limit, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";

interface NetworkGraphViewProps {
  currentUser: any;
  showToast: (icon: string, title: string, desc: string) => void;
  onBack: () => void;
}

interface GraphNode {
  id: string;
  name: string;
  group: "core" | "member" | "developer" | "service";
  strength: number;
  role: string;
  status: string;
}

interface GraphLink {
  source: string;
  target: string;
  strength: number;
}

export const NetworkGraphView: React.FC<NetworkGraphViewProps> = ({
  currentUser,
  showToast,
  onBack,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [neuralProfiles, setNeuralProfiles] = useState<any[]>([]);
  const [developerProfiles, setDeveloperProfiles] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [recalcTick, setRecalcTick] = useState(0);

  // Subscribe to public real-time Firestore collections so graph always reflects real data
  useEffect(() => {
    const unsubNeural = onSnapshot(
      query(collection(db, "neural_profiles"), limit(30)),
      (snap) => {
        setNeuralProfiles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {},
    );

    const unsubDevs = onSnapshot(
      query(collection(db, "gamura_developers"), limit(24)),
      (snap) => {
        setDeveloperProfiles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {},
    );

    const unsubConns =
      currentUser && currentUser.uid && currentUser.uid !== "guest_explorer_uid"
        ? onSnapshot(
            query(collection(db, "neural_connections"), limit(40)),
            (snap) => {
              setConnections(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            },
            () => {},
          )
        : () => {};

    return () => {
      unsubNeural();
      unsubDevs();
      unsubConns();
    };
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!svgRef.current) return;
    const width = svgRef.current.clientWidth || 720;
    const height = svgRef.current.clientHeight || 520;

    // Build dynamic real-time nodes from Firestore + Gamura infrastructure
    const nodesMap = new Map<string, GraphNode>();

    const meLabel =
      currentUser && currentUser.uid !== "guest_explorer_uid"
        ? currentUser.displayName || currentUser.email?.split("@")[0] || "You"
        : "Gamura Hub";

    nodesMap.set("hub", {
      id: "hub",
      name: meLabel,
      group: "core",
      strength: 100,
      role: "Workspace Root",
      status: "Online",
    });

    nodesMap.set("svc_gpg", {
      id: "svc_gpg",
      name: "GPG Engine",
      group: "service",
      strength: 96,
      role: "Prompt Intelligence",
      status: "Active",
    });

    nodesMap.set("svc_firestore", {
      id: "svc_firestore",
      name: "Firestore Mesh",
      group: "service",
      strength: 95,
      role: "Real-Time Sync",
      status: "Connected",
    });

    const uidToNodeId = new Map<string, string>();

    neuralProfiles.forEach((p: any) => {
      const nodeId = `np_${p.uid || p.id}`;
      if (p.uid) uidToNodeId.set(p.uid, nodeId);
      const pulseMs = p.lastPulse?.toDate
        ? p.lastPulse.toDate().getTime()
        : p.lastPulse?.seconds
          ? p.lastPulse.seconds * 1000
          : 0;
      const isOnline = pulseMs > 0 && Date.now() - pulseMs < 60000;
      if (!nodesMap.has(nodeId)) {
        nodesMap.set(nodeId, {
          id: nodeId,
          name: `@${p.nickname || p.id}`,
          group: "member",
          strength: isOnline ? 92 : 76,
          role: "Neutral Link Member",
          status: isOnline ? "Active" : "Synced",
        });
      }
    });

    developerProfiles.forEach((dev: any) => {
      const username = dev.username || dev.id;
      const existingByUid = dev.uid ? uidToNodeId.get(dev.uid) : undefined;
      if (!existingByUid) {
        const nodeId = `dev_${username}`;
        if (!nodesMap.has(nodeId)) {
          nodesMap.set(nodeId, {
            id: nodeId,
            name: dev.displayName || `/@${username}`,
            group: "developer",
            strength: dev.published ? 88 : 70,
            role: dev.published ? "Published URL Page" : "Draft Profile",
            status: dev.published ? "Live" : "Draft",
          });
        }
      }
    });

    const rawNodes = Array.from(nodesMap.values());
    const linksList: GraphLink[] = [
      { source: "hub", target: "svc_gpg", strength: 0.95 },
      { source: "hub", target: "svc_firestore", strength: 0.95 },
    ];

    rawNodes.forEach((n) => {
      if (n.id !== "hub" && n.id !== "svc_gpg" && n.id !== "svc_firestore") {
        linksList.push({
          source: n.group === "developer" ? "svc_firestore" : "hub",
          target: n.id,
          strength: n.strength / 100,
        });
      }
    });

    connections.forEach((conn: any) => {
      if (Array.isArray(conn.uids) && conn.uids.length >= 2) {
        const a = uidToNodeId.get(conn.uids[0]);
        const b = uidToNodeId.get(conn.uids[1]);
        if (a && b && a !== b) {
          linksList.push({ source: a, target: b, strength: 0.9 });
        }
      }
    });

    const filteredNodes = rawNodes.filter(
      (n) => filterType === "all" || n.group === filterType || n.id === "hub",
    );
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = linksList
      .filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target))
      .map((l) => ({ ...l }));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.45, 3.2])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom as any);

    const simulation = d3
      .forceSimulation(filteredNodes as any)
      .force(
        "link",
        d3
          .forceLink(filteredLinks)
          .id((d: any) => d.id)
          .distance((d: any) => 135 - d.strength * 40),
      )
      .force("charge", d3.forceManyBody().strength(-360))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(58));

    simulationRef.current = simulation;

    const link = g
      .append("g")
      .selectAll("line")
      .data(filteredLinks)
      .enter()
      .append("line")
      .attr("stroke", "rgba(0, 113, 227, 0.2)")
      .attr("stroke-width", (d: any) => Math.max(1.5, d.strength * 3));

    const node = g
      .append("g")
      .selectAll("g")
      .data(filteredNodes)
      .enter()
      .append("g")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any,
      )
      .on("click", (_event, d: any) => {
        setSelectedNode(d);
      });

    const fillColor = (d: GraphNode) => {
      if (d.id === "hub") return "#1D1D1F";
      if (d.group === "member") return "#0071E3";
      if (d.group === "developer") return "#10B981";
      return "#6366F1";
    };

    node
      .append("circle")
      .attr("r", (d: any) => (d.id === "hub" ? 26 : 18))
      .attr("fill", (d: any) => fillColor(d))
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 3)
      .style("filter", "drop-shadow(0px 4px 10px rgba(0, 0, 0, 0.12))");

    node
      .append("text")
      .text((d: any) =>
        d.name.length > 18 ? d.name.slice(0, 17) + "…" : d.name,
      )
      .attr("x", 0)
      .attr("y", (d: any) => (d.id === "hub" ? 42 : 34))
      .attr("text-anchor", "middle")
      .attr("fill", "#1D1D1F")
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 4)
      .style("paint-order", "stroke")
      .style("font-size", "11px")
      .style("font-weight", "600");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [
    filterType,
    neuralProfiles,
    developerProfiles,
    connections,
    currentUser?.uid,
    currentUser?.displayName,
    recalcTick,
  ]);

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(220)
      .call(zoomBehaviorRef.current.scaleBy as any, factor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomBehaviorRef.current.transform as any, d3.zoomIdentity);
  };

  const handleRecalculate = () => {
    setRecalcTick((t) => t + 1);
    showToast(
      "🔄",
      "Layout Recalculated",
      "Graph force topology synced with live nodes.",
    );
  };

  return (
    <div className="flex-1 flex flex-col space-y-5 font-sans text-[#1D1D1F]">
      {/* Header */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} /> Back to Overview
          </button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F]">
              Universe Connection Graph
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0071E3] text-[11px] font-semibold">
              Live Sync
            </span>
          </div>
          <p className="text-xs text-[#6E6E73]">
            Interactive map of active Neutral Link profiles, published pages, and core services.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-[#F5F5F7] border border-zinc-200/80 rounded-xl p-1">
            {[
              { id: "all", label: "All" },
              { id: "member", label: "Members" },
              { id: "developer", label: "URL Pages" },
              { id: "service", label: "Services" },
            ].map((ft) => (
              <button
                key={ft.id}
                onClick={() => setFilterType(ft.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  filterType === ft.id
                    ? "bg-white text-[#1D1D1F] shadow-xs"
                    : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                {ft.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleRecalculate}
            className="px-3.5 py-2 bg-[#1D1D1F] hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw size={13} /> Re-Calculate
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 flex-1">
        <div className="lg:col-span-3 bg-white border border-zinc-200/80 rounded-3xl relative overflow-hidden flex flex-col h-[460px] sm:h-[540px] shadow-xs">
          {/* Top-left live pill & Top-right zoom controls */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur border border-zinc-200/80 px-3 py-1.5 rounded-full text-[11px] font-semibold text-[#1D1D1F] shadow-xs pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Nodes Active
            </div>
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur border border-zinc-200/80 p-1 rounded-xl shadow-xs pointer-events-auto">
              <button
                onClick={() => handleZoom(1.25)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 text-[#1D1D1F] cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
              <button
                onClick={() => handleZoom(0.8)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 text-[#1D1D1F] cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 rounded-lg hover:bg-zinc-100 text-[#1D1D1F] cursor-pointer"
                title="Reset View"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          <svg
            ref={svgRef}
            className="w-full flex-1 cursor-grab active:cursor-grabbing bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px]"
          />

          {/* Bottom Legend */}
          <div className="px-4 py-2.5 bg-[#F5F5F7]/80 border-t border-zinc-200/60 flex flex-wrap items-center gap-4 text-[11px] font-medium text-[#6E6E73]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1D1D1F]" /> Core Hub
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0071E3]" /> Neutral Link Users
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Published URL Pages
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" /> System Services
            </span>
          </div>
        </div>

        {/* Inspector Panel */}
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 flex flex-col justify-between shadow-xs">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E6E73]">
                Node Inspector
              </h3>
              <Compass size={16} className="text-[#6E6E73]" />
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1D1D1F] text-white font-bold text-lg flex items-center justify-center">
                  {selectedNode.name.replace(/^[@/]+/, "").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#1D1D1F] break-all">
                    {selectedNode.name}
                  </h4>
                  <p className="text-xs text-[#6E6E73] mt-0.5">{selectedNode.role}</p>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-zinc-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6E6E73]">Category</span>
                    <span className="font-semibold capitalize text-[#1D1D1F]">
                      {selectedNode.group}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6E6E73]">Signal Strength</span>
                    <span className="font-semibold text-[#1D1D1F]">
                      {selectedNode.strength}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6E6E73]">Status</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <Activity size={12} /> {selectedNode.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-14 space-y-2.5">
                <Users className="mx-auto text-zinc-300" size={32} />
                <p className="text-xs text-[#6E6E73] leading-relaxed">
                  Tap any node on the graph to view its live connection status and category.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-100 text-[11px] text-[#6E6E73] text-center">
            {neuralProfiles.length + developerProfiles.length + 3} Live Nodes Connected
          </div>
        </div>
      </div>
    </div>
  );
};
