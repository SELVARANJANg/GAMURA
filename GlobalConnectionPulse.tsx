import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { Activity, Users, Zap, Compass, RefreshCw, Radio, HardDrive, Shield } from "lucide-react";

interface NodeData extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  avatar?: string;
  role?: string;
  lastActive?: any;
  clicks?: number;
  val: number;
  details?: string;
}

interface LinkData extends d3.SimulationLinkDatum<NodeData> {
  source: string | NodeData;
  target: string | NodeData;
  type: string;
  value: number;
}

interface GlobalConnectionPulseProps {
  allUsers: any[];
  globalConnections: any[];
}

export const GlobalConnectionPulse: React.FC<GlobalConnectionPulseProps> = ({
  allUsers,
  globalConnections,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [layoutMode, setLayoutMode] = useState<"force" | "orbit" | "matrix">("force");
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [packetBurst, setPacketBurst] = useState(0);

  // Map users & core nodes
  const nodes: NodeData[] = useMemo(() => {
    const userNodes = allUsers.map((u) => {
      // Find clean nickname
      const label = u.nickname || u.username || `@User_${(u.id || u.uid || "").substring(0, 5)}`;
      return {
        id: u.uid || u.id,
        label: label.startsWith("@") ? label : `@${label}`,
        type: "user",
        avatar: u.avatarUrl || "",
        role: u.role || "member",
        lastActive: u.lastActive || u.lastLogin || null,
        clicks: u.clicks || 0,
        val: 10,
        details: "Registered active neural link in the main GAMURA ecosystem.",
      };
    });

    const systemNodes = [
      { id: "gamura_core", label: "👾 GAMURA-CORE v2", type: "core", role: "central-host", val: 22, details: "The primary centralized multi-user socket router & synchronization hyper-engine." },
      { id: "selvaranjan_central", label: "👑 SELVARANJAN-MAIN", type: "central", role: "owner-node", val: 18, details: "Aura master architect database node. Hosting Selvaranjan live page." },
      { id: "aura_bridge", label: "⚡ AURA GATEWAY", type: "gateway", role: "quantum-link", val: 14, details: "Tunneling secure Google & GAMURA ID auth states across iframes." },
      { id: "bubu_orchestration", label: "🐻 BUBU-COSMIC", type: "bubu", role: "ai-sync-bot", val: 15, details: "Autonomous gaming bot designed for background pulse stimulation." },
      { id: "galaxy_hyperlink", label: "🌀 GALAXY HYPERLINK", type: "hyper", role: "quantum-link", val: 14, details: "High-frequency interstellar message packet delivery agent." },
    ];

    return [...userNodes, ...systemNodes] as NodeData[];
  }, [allUsers]);

  // Links between nodes
  const links: LinkData[] = useMemo(() => {
    const dbLinks: LinkData[] = globalConnections
      .map((c) => {
        const uids = c.uids || [];
        if (uids.length < 2) return null;
        return {
          source: uids[0],
          target: uids[1],
          type: "neural",
          value: 3,
        };
      })
      .filter((l): l is LinkData => l !== null);

    const structuralLinks: LinkData[] = [];

    // Connect user nodes gracefully to system cores to construct a spectacular sci-fi layout
    nodes.forEach((n) => {
      if (n.type === "user") {
        // Deterministic connection routing based on id character code sum
        const sum = n.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const targetHost = sum % 3 === 0 
          ? "gamura_core" 
          : sum % 3 === 1 
            ? "selvaranjan_central" 
            : "bubu_orchestration";

        structuralLinks.push({
          source: n.id,
          target: targetHost,
          type: "quantum-tether",
          value: 1.5,
        });

        // Add additional cross links for highly responsive dense graphs
        if (nodes.length > 5 && Math.random() > 0.85) {
          structuralLinks.push({
            source: n.id,
            target: "galaxy_hyperlink",
            type: "aux-tether",
            value: 1,
          });
        }
      }
    });

    // Central infrastructure backbone linkages
    structuralLinks.push({ source: "gamura_core", target: "selvaranjan_central", type: "core-backbone", value: 5 });
    structuralLinks.push({ source: "selvaranjan_central", target: "aura_bridge", type: "core-backbone", value: 4 });
    structuralLinks.push({ source: "aura_bridge", target: "bubu_orchestration", type: "core-backbone", value: 4 });
    structuralLinks.push({ source: "bubu_orchestration", target: "galaxy_hyperlink", type: "core-backbone", value: 4 });
    structuralLinks.push({ source: "galaxy_hyperlink", target: "gamura_core", type: "core-backbone", value: 4 });

    return [...dbLinks, ...structuralLinks];
  }, [nodes, globalConnections]);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 640;
    const height = 310;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");

    // Clear previous elements
    svg.selectAll("*").remove();

    // Defs for glowing effects and arrows
    const defs = svg.append("defs");
    
    // Core glow filter
    const glowFilter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%");
    glowFilter.append("feGaussianBlur")
      .attr("stdDeviation", "5")
      .attr("result", "blur");
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "blur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Dynamic linear gradients for links
    const linkGradient = defs.append("linearGradient")
      .attr("id", "link-grad")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "100%").attr("y2", "100%");
    linkGradient.append("stop").attr("offset", "0%").attr("stop-color", "#FF1F4B").attr("stop-opacity", 0.6);
    linkGradient.append("stop").attr("offset", "100%").attr("stop-color", "#0EA5E9").attr("stop-opacity", 0.6);

    // Deep copy arrays for D3 state manipulation
    const dNodes: NodeData[] = JSON.parse(JSON.stringify(nodes));
    const dLinks: LinkData[] = JSON.parse(JSON.stringify(links)).map((l: any) => {
      // Find matched node references
      const sourceNode = dNodes.find(n => n.id === (typeof l.source === "object" ? l.source.id : l.source));
      const targetNode = dNodes.find(n => n.id === (typeof l.target === "object" ? l.target.id : l.target));
      return {
        ...l,
        source: sourceNode || l.source,
        target: targetNode || l.target
      };
    });

    // Create central Container group
    const gContainer = svg.append("g").attr("class", "graph-container");

    // Implement Zoom and Pan
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on("zoom", (event) => {
        gContainer.attr("transform", event.transform);
      });
    svg.call(zoom);

    // Render Links
    const link = gContainer.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(dLinks)
      .enter()
      .append("line")
      .attr("stroke", (d) => {
        if (d.type === "core-backbone") return "url(#link-grad)";
        if (d.type === "neural") return "#10F080";
        return "rgba(255, 255, 255, 0.08)";
      })
      .attr("stroke-opacity", (d) => (d.type === "core-backbone" ? 0.75 : d.type === "neural" ? 0.8 : 0.3))
      .attr("stroke-width", (d) => (d.type === "core-backbone" ? 2.5 : d.type === "neural" ? 2 : 1))
      .attr("stroke-dasharray", (d) => (d.type === "quantum-tether" ? "3,3" : "none"));

    // Moving signal packet circles traversing connections
    const packetGroup = gContainer.append("g").attr("class", "packets");
    
    // Add packets onto active or core links
    const packetLinks = dLinks.filter(d => d.type === "core-backbone" || d.type === "neural" || Math.random() > 0.65);
    const packets = packetGroup.selectAll("circle")
      .data(packetLinks)
      .enter()
      .append("circle")
      .attr("r", 2.5)
      .attr("fill", (d) => (d.type === "neural" ? "#10F080" : "#0EA5E9"))
      .attr("filter", "url(#glow)");

    // Render Node groups
    const node = gContainer.append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, NodeData>(".node-group")
      .data(dNodes)
      .enter()
      .append("g")
      .attr("class", "node-group")
      .style("cursor", "grab")
      .on("click", (event, d) => {
        setSelectedNode(d);
        event.stopPropagation();
      })
      .on("mouseover", (event, d) => {
        setHoveredNode(d);
        // Highlight links connected to this node
        link.attr("stroke-opacity", (l) => {
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          return s === d.id || t === d.id ? 1.0 : 0.15;
        });
      })
      .on("mouseout", () => {
        setHoveredNode(null);
        link.attr("stroke-opacity", (l) => (l.type === "core-backbone" ? 0.75 : l.type === "neural" ? 0.8 : 0.3));
      });

    // Node circular hosts
    node.append("circle")
      .attr("r", (d) => d.val)
      .attr("fill", (d) => {
        if (d.type === "core") return "#FF1F4B";
        if (d.type === "central") return "#8B5CF6";
        if (d.type === "bubu") return "#F59E0B";
        if (d.type === "gateway" || d.type === "hyper") return "#0EA5E9";
        return "rgb(15, 23, 42)";
      })
      .attr("stroke", (d) => {
        if (d.type === "user") return "#10F080";
        return "rgba(255,255,255,0.15)";
      })
      .attr("stroke-width", (d) => (d.type === "user" ? 2 : 1.5))
      .attr("filter", (d) => (d.type === "core" || d.type === "user" ? "url(#glow)" : "none"));

    // Pulse Ring for core or active user nodes
    node.filter(d => d.type === "core" || d.type === "central" || d.type === "user")
      .append("circle")
      .attr("r", (d) => d.val + 6)
      .attr("fill", "none")
      .attr("stroke", (d) => (d.type === "user" ? "#10F080" : d.type === "core" ? "#FF1F4B" : "#8B5CF6"))
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.4)
      .append("animate")
      .attr("attributeName", "r")
      .attr("values", (d) => `${d.val + 2};${d.val + 14}`)
      .attr("dur", "2.5s")
      .attr("repeatCount", "indefinite");

    // Text labels
    node.append("text")
      .attr("dx", (d) => d.val + 6)
      .attr("dy", 3)
      .attr("fill", "#E2E8F0")
      .style("font-size", (d) => (d.type === "core" || d.type === "central" ? "10px" : "8px"))
      .style("font-family", "'JetBrains Mono', monospace")
      .style("font-weight", "bold")
      .text((d) => d.label);

    // Apply simulation patterns
    const simulation = d3.forceSimulation<NodeData>(dNodes);

    if (layoutMode === "force") {
      simulation
        .force("link", d3.forceLink<NodeData, LinkData>(dLinks).id((d: any) => d.id).distance((d: any) => (d.type === "core-backbone" ? 65 : 45)))
        .force("charge", d3.forceManyBody().strength(-120))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide<NodeData>().radius((d: any) => d.val + 12));
    } else if (layoutMode === "orbit") {
      // Concentric structural layouts
      dNodes.forEach((n, i) => {
        const radius = n.type === "core" ? 0 : n.type === "central" ? 60 : n.type === "user" ? 170 : 110;
        const angle = (i * 2 * Math.PI) / dNodes.length;
        n.x = width / 2 + Math.cos(angle) * radius;
        n.y = height / 2 + Math.sin(angle) * radius;
      });
      simulation
        .force("link", d3.forceLink<NodeData, LinkData>(dLinks).id((d) => d.id).strength(0.08))
        .force("charge", d3.forceManyBody().strength(-30))
        .force("center", d3.forceCenter(width / 2, height / 2));
    } else {
      // Grid Matrix deployment layout
      const cols = Math.ceil(Math.sqrt(dNodes.length));
      const spacingX = width / (cols + 1);
      const spacingY = height / (Math.ceil(dNodes.length / cols) + 1);
      
      dNodes.sort((a,b) => b.val - a.val).forEach((n, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        n.x = spacingX * (c + 1);
        n.y = spacingY * (r + 1);
      });
      simulation
        .force("link", d3.forceLink<NodeData, LinkData>(dLinks).id((d) => d.id).strength(0.02))
        .force("center", d3.forceCenter(width / 2, height / 2));
    }

    // Interactive Drag Mechanics
    const drag = d3.drag<SVGGElement, NodeData>()
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
      });

    node.call(drag as any);

    // Animation frames update tick
    let frameId = 0;
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);

      // Update signal packets traversing linkages
      frameId++;
      const timeFactor = (frameId % 200) / 200; // loop periodically
      packets
        .attr("cx", (d: any) => d.source.x + (d.target.x - d.source.x) * timeFactor)
        .attr("cy", (d: any) => d.source.y + (d.target.y - d.source.y) * timeFactor);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, layoutMode, packetBurst]);

  const stats = useMemo(() => {
    return {
      totalNodes: nodes.length,
      activeUsers: nodes.filter(n => n.type === "user").length,
      coreSystems: nodes.filter(n => n.type !== "user").length,
      totalLinks: links.length,
    };
  }, [nodes, links]);

  return (
    <div className="ud-panel col-span-full border border-zinc-800/80 rounded-2xl bg-slate-950 overflow-hidden shadow-2xl relative" id="global-connection-pulse-container" ref={containerRef}>
      {/* HUD Bar */}
      <div className="ud-panel-head bg-black px-5 py-3.5 border-b border-zinc-900 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="absolute -top-1 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10F080] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10F080]"></span>
            </span>
            <Radio className="w-4 h-4 text-[#10F080]" />
          </div>
          <div>
            <span className="text-[11px] font-black tracking-[0.25em] text-white uppercase font-sans flex items-center gap-2">
              Global Connection Pulse
            </span>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono mt-0.5">
              REAL-TIME NEURAL FORCE VISUALIZER
            </p>
          </div>
        </div>

        {/* HUD control widgets */}
        <div className="flex items-center gap-1.5 self-end md:self-auto bg-zinc-950 p-1 border border-zinc-900 rounded-lg">
          <button
            onClick={() => setLayoutMode("force")}
            className={`px-2.5 py-1 text-[9px] font-extrabold pb-0.5 tracking-wider uppercase rounded transition-all font-mono ${
              layoutMode === "force"
                ? "bg-sky-500/10 border border-sky-500/20 text-sky-450"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
            title="Standard force simulation gravity mechanics"
          >
            🛰 Gravity Force
          </button>
          <button
            onClick={() => setLayoutMode("orbit")}
            className={`px-2.5 py-1 text-[9px] font-extrabold pb-0.5 tracking-wider uppercase rounded transition-all font-mono ${
              layoutMode === "orbit"
                ? "bg-purple-500/10 border border-purple-500/20 text-purple-400"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
            title="Concentric structural system orbiting cores"
          >
            🌀 Core Orbits
          </button>
          <button
            onClick={() => setLayoutMode("matrix")}
            className={`px-2.5 py-1 text-[9px] font-extrabold pb-0.5 tracking-wider uppercase rounded transition-all font-mono ${
              layoutMode === "matrix"
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
            title="Aligned grid matrix mapping layout"
          >
            ⚙ Matrix Grid
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[310px] bg-[#03060E] relative">
        {/* Left Stats Section */}
        <div className="lg:col-span-1 p-4.5 border-r border-zinc-900/60 bg-[#060B18]/60 flex flex-col justify-between gap-4 font-mono select-none">
          <div className="space-y-4">
            <span className="text-[8px] font-black text-zinc-500 tracking-widest uppercase block mb-1 font-mono">
              SYSTEM CHIP TELEMETRY
            </span>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Users className="w-3.5 h-3.5 text-[#10F080]" />
                  <span className="text-[10px] font-bold">CORE USERS</span>
                </div>
                <span className="text-[12px] font-black text-[#10F080]">{stats.activeUsers}</span>
              </div>

              <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] font-bold">CORES</span>
                </div>
                <span className="text-[12px] font-black text-purple-400">{stats.coreSystems}</span>
              </div>

              <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[10px] font-bold">UPLINK CLUSTERS</span>
                </div>
                <span className="text-[12px] font-black text-sky-400">{stats.totalLinks}</span>
              </div>

              <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Shield className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[10px] font-bold">CRYPTO SECURITY</span>
                </div>
                <span className="text-[9px] font-black text-red-400">AES-256</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-auto">
            <button
              onClick={() => setPacketBurst(prev => prev + 1)}
              className="w-full bg-[#10F080]/10 hover:bg-[#10F080]/20 border border-[#10F080]/20 text-[#10F080] py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black tracking-widest uppercase transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> TRIGGER PACKET FLUX
            </button>
            <p className="text-[8px] text-zinc-650 leading-relaxed text-center">
              DRAG NODES TO MUTATE GRAVITY FIELD. SCROLL TO ZOOM.
            </p>
          </div>
        </div>

        {/* Dynamic canvas display */}
        <div className="lg:col-span-3 relative h-[310px] lg:h-auto overflow-hidden">
          <svg className="w-full h-full block" ref={svgRef}></svg>

          {/* Node Interaction Details overlay */}
          {(selectedNode || hoveredNode) && (
            <div className="absolute bottom-3 left-3 right-3 bg-[#03060ea0] backdrop-blur-md border border-zinc-800/80 p-3 rounded-xl max-w-sm font-sans select-none pointer-events-none animate-fade-in">
              {(() => {
                const node = hoveredNode || selectedNode;
                if (!node) return null;
                const isSystem = node.type !== "user";
                return (
                  <div>
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isSystem ? "bg-red-500 shadow-[0_0_8px_#ff1f4b]" : "bg-[#10F080] shadow-[0_0_8px_#10f080]"}`} />
                        <span className="text-[12.5px] font-black text-white">{node.label}</span>
                      </div>
                      <span className="text-[8px] bg-white/10 px-2 py-0.5 rounded font-mono font-bold uppercase text-zinc-400">
                        {node.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-medium leading-relaxed mt-1.5">
                      {node.details}
                    </p>
                    {!isSystem && (
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-zinc-900 text-[9px] font-mono font-bold text-zinc-500">
                        <span>CLICKS: <strong className="text-zinc-200">{node.clicks}</strong></span>
                        <span>STATUS: <strong className="text-[#10F080]">ACTIVE</strong></span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
