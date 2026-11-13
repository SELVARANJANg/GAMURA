import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Users, Shield, Zap, RefreshCw, ZoomIn, ZoomOut, Compass } from "lucide-react";

interface NetworkGraphViewProps {
  currentUser: any;
  showToast: (icon: string, title: string, desc: string) => void;
  onBack: () => void;
}

export const NetworkGraphView: React.FC<NetworkGraphViewProps> = ({ currentUser, showToast, onBack }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const initialNodes = [
    { id: "me", name: currentUser?.displayName || "You (Nexus Core)", group: "core", strength: 100, role: "Administrator", status: "Online" },
    { id: "node1", name: "Selvaranjan S.", group: "ally", strength: 92, role: "Lead Architect", status: "Active" },
    { id: "node2", name: "Aura Sentinel", group: "ai", strength: 88, role: "AI Guardian", status: "Syncing" },
    { id: "node3", name: "Nexus Node Alpha", group: "node", strength: 75, role: "Relay Station", status: "Online" },
    { id: "node4", name: "Quantum Sphere", group: "node", strength: 68, role: "Data Sphere", status: "Idle" },
    { id: "node5", name: "GCP Cloud Gateway", group: "service", strength: 85, role: "Infrastructure", status: "Connected" },
    { id: "node6", name: "Firestore Ledger", group: "service", strength: 90, role: "Database", status: "Active" },
    { id: "node7", name: "Kaelen V.", group: "ally", strength: 60, role: "Security Operative", status: "Away" },
    { id: "node8", name: "Lyra Protocol", group: "ai", strength: 82, role: "Sub-Routine", status: "Active" }
  ];

  const initialLinks = [
    { source: "me", target: "node1", strength: 0.9 },
    { source: "me", target: "node2", strength: 0.85 },
    { source: "me", target: "node5", strength: 0.8 },
    { source: "me", target: "node6", strength: 0.95 },
    { source: "node1", target: "node3", strength: 0.7 },
    { source: "node2", target: "node8", strength: 0.88 },
    { source: "node3", target: "node4", strength: 0.6 },
    { source: "node5", target: "node6", strength: 0.99 },
    { source: "me", target: "node7", strength: 0.5 },
    { source: "node7", target: "node1", strength: 0.65 }
  ];

  useEffect(() => {
    if (!svgRef.current) return;
    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    const filteredNodes = initialNodes.filter(n => filterType === "all" || n.group === filterType || n.id === "me");
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = initialLinks.filter(l => {
      const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return nodeIds.has(srcId) && nodeIds.has(tgtId);
    }).map(l => ({ ...l }));

    const simulation = d3.forceSimulation(filteredNodes as any)
      .force("link", d3.forceLink(filteredLinks).id((d: any) => d.id).distance((d: any) => 150 - (d.strength * 80)))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    const link = g.append("g")
      .selectAll("line")
      .data(filteredLinks)
      .enter()
      .append("line")
      .attr("stroke", "rgba(255,255,255,0.2)")
      .attr("stroke-width", (d: any) => Math.max(1, d.strength * 4));

    const node = g.append("g")
      .selectAll("g")
      .data(filteredNodes)
      .enter()
      .append("g")
      .call(d3.drag()
        .on("start", (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any)
      .on("click", (event, d) => {
        setSelectedNode(d);
        showToast("🔗", `Selected Node: ${d.name}`, `Connection Strength: ${d.strength}% | Role: ${d.role}`);
      });

    node.append("circle")
      .attr("r", (d: any) => d.id === "me" ? 28 : 20)
      .attr("fill", (d: any) => d.id === "me" ? "#ffffff" : d.group === "ai" ? "#22d3ee" : d.group === "service" ? "#a1a1aa" : "#52525b")
      .attr("stroke", "#000000")
      .attr("stroke-width", 3);

    node.append("text")
      .text((d: any) => d.name)
      .attr("x", 0)
      .attr("y", 34)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .style("font-size", "10px")
      .style("font-weight", "bold");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filterType]);

  return (
    <div className="flex-1 p-6 md:p-8 bg-black text-white flex flex-col space-y-6 min-h-[800px] font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <button onClick={onBack} className="text-xs text-zinc-400 hover:text-white mb-2 flex items-center gap-1 cursor-pointer">
            ← Back to Analytics
          </button>
          <h1 className="text-2xl font-black uppercase tracking-wider flex items-center gap-3">
            <Users className="text-white" size={24} />
            Universe Connection Network <span className="text-[10px] bg-white text-black px-2 py-0.5 rounded font-mono">D3 Force Graph</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Real-time proximity and connection strength matrix between linked neural profiles.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-zinc-900 border border-white/10 rounded-xl p-1">
            {["all", "ally", "ai", "service"].map((ft) => (
              <button
                key={ft}
                onClick={() => setFilterType(ft)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${filterType === ft ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
              >
                {ft}
              </button>
            ))}
          </div>
          <button
            onClick={() => showToast("🔄", "Graph Re-Synced", "Calculated optimal spring tension and node gravity.")}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} /> Re-Calculate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        <div className="lg:col-span-3 bg-zinc-950 border border-white/10 rounded-2xl relative overflow-hidden flex flex-col h-[650px] shadow-2xl">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/80 backdrop-blur border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> SIMULATION ACTIVE (D3 v7)
          </div>

          <svg ref={svgRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />
        </div>

        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-200">Node Inspect</h3>
              <Compass size={16} className="text-zinc-400" />
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-white text-black font-black text-lg flex items-center justify-center">
                  {selectedNode.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{selectedNode.name}</h4>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{selectedNode.role}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Node Type:</span>
                    <span className="font-bold uppercase text-white">{selectedNode.group}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Connection Strength:</span>
                    <span className="font-bold text-white">{selectedNode.strength}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Status:</span>
                    <span className="font-bold text-emerald-400">{selectedNode.status}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 space-y-3">
                <Users className="mx-auto text-zinc-700" size={36} />
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Click any node in the graph to inspect connection metrics and proximity.</p>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-white/10 text-[10px] text-zinc-500 text-center font-mono">
            GAMURA UNIVERSE D3 GRAPH v2.4
          </div>
        </div>
      </div>
    </div>
  );
};
