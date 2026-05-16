"use client"

import React, { useMemo } from "react"
import { useTree } from "@headless-tree/react"
import { syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature, expandAllFeature } from "@headless-tree/core"
import { FolderIcon, FolderOpenIcon, FileImage, Download, ExternalLink } from "lucide-react"
import { Tree, TreeItem, TreeItemLabel } from "@/components/ui/tree"
import { getImageUrl, MAP_TYPE_LABELS, type ArchiveEntry } from "@/lib/api"
import { formatTimestamp, formatTimestampLocal } from "@/lib/utils"

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

interface TreeNodeData {
  id: string
  name: string
  isFolder: boolean
  children?: string[]
  entry?: ArchiveEntry
}

export function ArchiveDetailTree({ entries }: { entries: ArchiveEntry[] }) {
  const treeData = useMemo(() => {
    const nodes: Record<string, TreeNodeData> = {
      root: { id: "root", name: "Maps", isFolder: true, children: [] }
    }

    entries.forEach(entry => {
      const label = MAP_TYPE_LABELS[entry.map_type] || entry.map_type;
      let groupName = "Other";
      let subGroupName = "Maps";

      if (label.includes("Surface Analysis")) {
        groupName = "Surface Analysis (Canada Coverage)";
        subGroupName = label.split(" - ")[1] || "Default";
      } else if (label.includes("Northern Hemispheric")) {
        groupName = "Northern Hemispheric";
        subGroupName = label.split(" - ")[1] || "Default";
      } else if (label.includes("Upper Air")) {
        groupName = "Upper Air (Pressure Maps)";
        subGroupName = label.split(" - ")[1] || "Default";
      } else {
        groupName = label;
      }

      const groupId = `group-${groupName}`;
      if (!nodes[groupId]) {
        nodes.root.children!.push(groupId);
        nodes[groupId] = { id: groupId, name: groupName, isFolder: true, children: [] };
      }

      const subGroupId = `sub-${groupName}-${subGroupName}`;
      if (!nodes[subGroupId]) {
        nodes[groupId].children!.push(subGroupId);
        nodes[subGroupId] = { id: subGroupId, name: subGroupName, isFolder: true, children: [] };
      }

      const fileId = `file-${entry.path || entry.filename}`;
      if (!nodes[fileId]) {
        nodes[subGroupId].children!.push(fileId);
        nodes[fileId] = {
          id: fileId,
          name: entry.filename,
          isFolder: false,
          entry
        };
      }
    });

    return nodes;
  }, [entries]);

  const tree = useTree<TreeNodeData>({
    initialState: {
      expandedItems: Object.keys(treeData).filter(k => treeData[k].isFolder && k !== "root"),
    },
    indent: 24,
    rootItemId: "root",
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => item.getItemData().isFolder,
    dataLoader: {
      getItem: (itemId) => treeData[itemId],
      getChildren: (itemId) => treeData[itemId].children ?? [],
    },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      expandAllFeature,
    ],
  });

  const handleDownload = async (url: string, filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(url, { cache: "no-store" });
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="glass rounded-2xl p-4 overflow-hidden border border-[var(--border)]">
      <Tree indent={24} tree={tree} className="w-full">
        {tree.getItems().map((item) => {
          const data = item.getItemData();
          if (!data) return null;

          return (
            <TreeItem key={item.getId()} item={item} className="group relative py-1 hover:bg-[var(--surface-variant)] rounded-lg transition-colors">
              <TreeItemLabel className="bg-transparent hover:bg-transparent flex-1 w-full flex items-center justify-between">
                <span className="flex items-center gap-2 overflow-hidden">
                  {item.isFolder() ? (
                    item.isExpanded() ? (
                      <FolderOpenIcon className="text-[var(--accent)] size-4 shrink-0" />
                    ) : (
                      <FolderIcon className="text-[var(--accent)] size-4 shrink-0" />
                    )
                  ) : (
                    <FileImage className="text-[var(--text-muted)] size-4 shrink-0" />
                  )}
                  
                  <span className="truncate text-sm text-[var(--text-primary)]">
                    {item.getItemName()}
                  </span>
                  
                  {item.isFolder() && (
                    <span className="text-[var(--text-muted)] text-xs bg-[var(--surface-container-high)] px-2 py-0.5 rounded-full ml-2">
                      {item.getChildren().length} map(s)
                    </span>
                  )}
                </span>
                
                {/* File Metadata & Actions (only for leaves) */}
                {!item.isFolder() && data.entry && (
                  <div className="flex items-center gap-6 text-xs pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="hidden md:inline-flex text-[var(--text-muted)]">
                      {formatBytes(data.entry.processed_size_bytes)}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(getImageUrl(data.entry!.image_url), "_blank");
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--surface-container-high)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent-dim)] transition-all border border-[var(--border)]"
                      >
                        <ExternalLink size={14} />
                        View
                      </button>
                      
                      <button 
                        onClick={(e) => handleDownload(getImageUrl(data.entry!.image_url), data.entry!.filename, e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-dim)] transition-all shadow-sm"
                      >
                        <Download size={14} />
                        DL WebP
                      </button>
                    </div>
                  </div>
                )}
              </TreeItemLabel>
            </TreeItem>
          )
        })}
      </Tree>
    </div>
  )
}
