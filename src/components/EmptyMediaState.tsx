import { Upload, Image } from "lucide-react";
import { Button } from "./ui/button";

interface EmptyMediaStateProps {
  onUpload: () => void;
}

export function EmptyMediaState({ onUpload }: EmptyMediaStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-neutral-100 mx-auto mb-6 flex items-center justify-center">
          <Image className="w-10 h-10 text-neutral-400" />
        </div>

        {/* Text */}
        <h3 className="text-neutral-900 mb-2">No media yet</h3>
        <p className="text-neutral-500 mb-6">
          Upload images, videos, and documents to get started with your media library
        </p>

        {/* Button */}
        <Button
          className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
          onClick={onUpload}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload your first file
        </Button>
      </div>
    </div>
  );
}
