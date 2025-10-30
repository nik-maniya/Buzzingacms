import { FileText, Film, FileImage, Edit2, Trash2, Link2 } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { MediaFile } from "./MediaLibrary";
import { cn } from "./ui/utils";

interface MediaListRowProps {
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

export function MediaListRow({ file, isSelected, onSelect, onClick }: MediaListRowProps) {
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
    <tr
      className={cn(
        "cursor-pointer border-b border-neutral-100 transition-colors",
        isSelected ? "bg-yellow-50" : "hover:bg-neutral-50"
      )}
      onClick={onClick}
    >
      {/* Checkbox */}
      <td className="px-4 py-3" onClick={handleCheckboxClick}>
        <Checkbox checked={isSelected} />
      </td>

      {/* Preview */}
      <td className="px-4 py-3">
        <div className="w-12 h-12 bg-neutral-100 rounded overflow-hidden flex items-center justify-center">
          {file.type === "image" ? (
            <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover" />
          ) : (
            <Icon className="w-6 h-6 text-neutral-400" />
          )}
        </div>
      </td>

      {/* File Name */}
      <td className="px-4 py-3">
        <span className="text-sm text-neutral-900">{file.name}</span>
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-neutral-500" />
          <span className="text-sm text-neutral-600 capitalize">{file.type}</span>
        </div>
      </td>

      {/* Size */}
      <td className="px-4 py-3">
        <span className="text-sm text-neutral-600">{file.size}</span>
      </td>

      {/* Uploaded */}
      <td className="px-4 py-3">
        <span className="text-sm text-neutral-600">{file.uploadDate}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            onClick={(e) => handleActionClick(e, "edit")}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            onClick={(e) => handleActionClick(e, "copy")}
          >
            <Link2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-neutral-600 hover:text-red-600 hover:bg-neutral-100"
            onClick={(e) => handleActionClick(e, "delete")}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
