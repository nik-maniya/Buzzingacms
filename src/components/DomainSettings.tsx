import { useState } from "react";
import { Copy, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { copyToClipboard } from "./ui/copy-to-clipboard";
import { cn } from "./ui/utils";

interface DNSRecord {
  id: string;
  type: "A" | "CNAME" | "TXT" | "MX";
  name: string;
  value: string;
  ttl: number;
  status: "active" | "warning" | "error";
}

export function DomainSettings() {
  const [dnsRecords] = useState<DNSRecord[]>([
    {
      id: "1",
      type: "A",
      name: "@",
      value: "192.168.0.10",
      ttl: 3600,
      status: "active",
    },
    {
      id: "2",
      type: "CNAME",
      name: "www",
      value: "buzzinga.design",
      ttl: 3600,
      status: "active",
    },
    {
      id: "3",
      type: "TXT",
      name: "@",
      value: "v=spf1 include:mail.buzzinga.design ~all",
      ttl: 3600,
      status: "warning",
    },
    {
      id: "4",
      type: "MX",
      name: "@",
      value: "mail.buzzinga.design",
      ttl: 3600,
      status: "active",
    },
    {
      id: "5",
      type: "TXT",
      name: "_dmarc",
      value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@buzzinga.design",
      ttl: 3600,
      status: "active",
    },
  ]);

  const handleCopyValue = async (value: string) => {
    const success = await copyToClipboard(value);
    if (success) {
      toast.success("Value copied to clipboard");
    } else {
      toast.error("Failed to copy value");
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case "A":
        return "bg-blue-100 text-blue-700";
      case "CNAME":
        return "bg-green-100 text-green-700";
      case "TXT":
        return "bg-orange-100 text-orange-700";
      case "MX":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50">
      {/* Top Bar */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-neutral-900">Domain & DNS Settings</h2>
            <Button
              variant="outline"
              disabled
              className="border-neutral-200 opacity-50 cursor-not-allowed"
            >
              Add Record
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8 space-y-6">
          {/* Domain Overview Card */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-neutral-900 mb-1">Domain</h3>
                <p className="text-2xl text-neutral-900">buzzinga.design</p>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                SSL Active
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Last Verified</p>
                <p className="text-sm text-neutral-900">Oct 29, 2025 at 10:42 AM</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-1">SSL Certificate</p>
                <p className="text-sm text-neutral-900">Valid until Dec 29, 2025</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="border-neutral-200 opacity-50 cursor-not-allowed"
              >
                Recheck SSL
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="border-neutral-200 opacity-50 cursor-not-allowed"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Certificate
              </Button>
            </div>
          </div>

          {/* DNS Records Table */}
          <div>
            <h3 className="text-neutral-900 mb-4">DNS Records</h3>
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm text-neutral-600">Type</th>
                    <th className="text-left px-6 py-3 text-sm text-neutral-600">Name</th>
                    <th className="text-left px-6 py-3 text-sm text-neutral-600">Value</th>
                    <th className="text-left px-6 py-3 text-sm text-neutral-600">TTL</th>
                    <th className="text-left px-6 py-3 text-sm text-neutral-600">Status</th>
                    <th className="text-right px-6 py-3 text-sm text-neutral-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dnsRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-1 rounded text-xs",
                            getRecordTypeColor(record.type)
                          )}
                        >
                          {record.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-900 font-mono">
                          {record.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 max-w-md">
                          <span className="text-sm text-neutral-900 font-mono truncate">
                            {record.value}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-600">{record.ttl}</span>
                      </td>
                      <td className="px-6 py-4">
                        {record.status === "active" ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Warning
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900"
                            onClick={() => handleCopyValue(record.value)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Custom Domain Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-sm text-blue-900 mb-3">Custom Domain Instructions</h4>
            <div className="space-y-2 text-sm text-blue-900">
              <p>1. Update your DNS records with your domain provider to match the records above.</p>
              <p>2. DNS propagation may take up to 24-48 hours to complete worldwide.</p>
              <p>
                3. After updating DNS, allow time for SSL certificate to be provisioned
                automatically.
              </p>
              <p className="pt-2 text-xs text-blue-700">
                Need help? Contact your domain registrar for assistance with DNS configuration.
              </p>
            </div>
          </div>

          {/* Read-Only Notice */}
          <div className="bg-neutral-100 border border-neutral-200 rounded-lg p-4">
            <p className="text-sm text-neutral-600 text-center">
              <strong>Note:</strong> DNS editing is read-only in this MVP version. For changes,
              please contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
