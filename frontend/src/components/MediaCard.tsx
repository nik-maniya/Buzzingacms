import { useState } from "react";
import { FileText, Film, FileImage, Link2, Edit2, Trash2 } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { MediaFile } from "./MediaLibrary";
import { cn } from "./ui/utils";

interface MediaCardProps {
  file: MediaFile;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
}

const typeIcons = {
  image: FileImage,
  video: Film,
  document: FileText,
  other: FileText,
};

export function MediaCard({ file, isSelected, onSelect, onClick }: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = typeIcons[file.type];

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleActionClick = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    console.log(action, file.id);
  };

  return (
    <div
      className={cn(
        "group relative bg-white rounded-lg border-2 overflow-hidden cursor-pointer transition-all",
        isSelected
          ? "border-yellow-400 shadow-lg"
          : "border-neutral-200 hover:border-neutral-300 hover:shadow-md"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-neutral-100 relative overflow-hidden">
        {file.type === "image" ? (
          <img
            src={file.thumbnail}
            alt={file.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-12 h-12 text-neutral-400" />
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-2 right-2 bg-neutral-900/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
          {file.type.toUpperCase()}
        </div>

        {/* Checkbox */}
        <div
          className={cn(
            "absolute top-2 left-2 transition-opacity",
            isSelected || isHovered ? "opacity-100" : "opacity-0"
          )}
          onClick={handleCheckboxClick}
        >
          <div className="bg-white rounded shadow-lg p-1">
            <Checkbox checked={isSelected} />
          </div>
        </div>

        {/* Quick Actions */}
        {isHovered && !isSelected && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 bg-white/90 hover:bg-white text-neutral-900"
              onClick={(e) => handleActionClick(e, "edit")}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 bg-white/90 hover:bg-white text-neutral-900"
              onClick={(e) => handleActionClick(e, "copy")}
            >
              <Link2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 bg-white/90 hover:bg-white text-red-600"
              onClick={(e) => handleActionClick(e, "delete")}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-3">
        <p className="text-sm text-neutral-900 truncate">{file.name}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{file.size}</p>
      </div>
    </div>
  );
}
