import { Forward, Trash2, Link as LinkIcon, X } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { copyToClipboard } from "./ui/copy-to-clipboard";

interface Response {
  id: string;
  formId: string;
  data: Record<string, string>;
  submittedAt: string;
}

interface ResponseDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: Response;
  formName: string;
  onDelete: (responseId: string) => void;
}

export function ResponseDrawer({
  open,
  onOpenChange,
  response,
  formName,
  onDelete,
}: ResponseDrawerProps) {
  const handleForward = () => {
    toast.success("Email forwarded successfully");
  };

  const handleCopyLink = async () => {
    const link = `https://buzzinga.design/admin/forms/${response.formId}/responses/${response.id}`;
    const success = await copyToClipboard(link);
    if (success) {
      toast.success("Response link copied");
    } else {
      toast.error("Failed to copy link");
    }
  };

  const handleDelete = () => {
    onDelete(response.id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-neutral-900">{formName}</SheetTitle>
              <p className="text-sm text-neutral-600 mt-1">Submission ID: {response.id}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Submission Info */}
          <div className="space-y-1">
            <p className="text-xs text-neutral-600">Submitted on</p>
            <p className="text-sm text-neutral-900">{response.submittedAt}</p>
          </div>

          <Separator />

          {/* Response Data */}
          <div className="space-y-4">
            <h4 className="text-sm text-neutral-900">Response Details</h4>
            {Object.entries(response.data).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <p className="text-xs text-neutral-600">{key}</p>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-sm text-neutral-900 whitespace-pre-wrap">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <h4 className="text-sm text-neutral-900">Actions</h4>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleForward}
              >
                <Forward className="w-4 h-4 mr-2" />
                Forward as email
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleCopyLink}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Copy response link
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete response
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
