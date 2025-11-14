import React, { useState, useEffect } from "react";
import { Copy, CheckCircle2, AlertTriangle, ExternalLink, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { copyToClipboard } from "./ui/copy-to-clipboard";
import { cn } from "./ui/utils";
import { domainAPI } from "../services/api";

interface DNSRecord {
  id: string;
  type: "A" | "CNAME" | "TXT" | "MX" | "NS" | "SRV";
  name: string;
  value: string;
  ttl: number;
  status: "active" | "warning" | "error";
}

interface Domain {
  id: string;
  name: string;
  sslActive: boolean;
  lastVerified?: string;
  sslValidUntil?: string;
}

// API Response types
interface DomainApiResponse {
  id: number;
  domainName: string;
  sslActive: boolean;
  sslValidUntil: string | null;
  lastVerified: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  dnsRecords?: DnsRecordApiResponse[];
}

interface DnsRecordApiResponse {
  id: number;
  domainId: number;
  type: string;
  name: string;
  value: string;
  ttl: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function DomainSettings() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Helper function to convert API response to Domain interface
  const mapApiDomainToDomain = (apiDomain: DomainApiResponse): Domain => {
    return {
      id: apiDomain.id.toString(),
      name: apiDomain.domainName,
      sslActive: apiDomain.sslActive,
      lastVerified: apiDomain.lastVerified
        ? new Date(apiDomain.lastVerified).toLocaleString()
        : undefined,
      sslValidUntil: apiDomain.sslValidUntil
        ? new Date(apiDomain.sslValidUntil).toLocaleDateString()
        : undefined,
    };
  };

  // Helper function to convert API DNS record to DNSRecord interface
  const mapApiDnsRecordToDnsRecord = (apiRecord: DnsRecordApiResponse): DNSRecord => {
    const statusMap: Record<string, "active" | "warning" | "error"> = {
      ACTIVE: "active",
      WARNING: "warning",
      ERROR: "error",
      PENDING: "active",
    };

    return {
      id: apiRecord.id.toString(),
      type: apiRecord.type as "A" | "CNAME" | "TXT" | "MX",
      name: apiRecord.name,
      value: apiRecord.value,
      ttl: apiRecord.ttl,
      status: statusMap[apiRecord.status] || "active",
    };
  };

  // Fetch domain on component mount
  useEffect(() => {
    const fetchDomain = async () => {
      setIsFetching(true);
      try {
        const response = await domainAPI.getDomain();
        
        if (response.data.success) {
          const apiDomain = response.data.data as DomainApiResponse | null;
          
          if (apiDomain) {
            const domain = mapApiDomainToDomain(apiDomain);
            setDomains([domain]);
            
            // Update DNS records if they were included in the response
            if (apiDomain.dnsRecords && apiDomain.dnsRecords.length > 0) {
              const mappedRecords = apiDomain.dnsRecords.map(mapApiDnsRecordToDnsRecord);
              setDnsRecords(mappedRecords);
            } else {
              setDnsRecords([]);
            }
          } else {
            // No domain found
            setDomains([]);
            setDnsRecords([]);
          }
        }
      } catch (error: any) {
        console.error("Error fetching domain:", error);
        // Don't show error toast on initial load - just show empty state
        setDomains([]);
        setDnsRecords([]);
      } finally {
        setIsFetching(false);
      }
    };

    fetchDomain();
  }, []);

  // Dialog states
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [isEditDomainOpen, setIsEditDomainOpen] = useState(false);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [isEditRecordOpen, setIsEditRecordOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Form states for adding domain
  const [domainForm, setDomainForm] = useState({
    name: "",
  });

  // Form states for adding DNS record
  const [dnsRecordForm, setDnsRecordForm] = useState({
    type: "A" as "A" | "CNAME" | "TXT" | "MX",
    name: "",
    value: "",
    ttl: 3600,
  });

  // Get the current domain (user's own domain)
  const currentDomain = domains.length > 0 ? domains[0] : null;
  const filteredDnsRecords = dnsRecords.filter(
    (record) => record.id // In a real app, filter by domainId
  );

  const handleCopyValue = async (value: string) => {
    const success = await copyToClipboard(value);
    if (success) {
      toast.success("Value copied to clipboard");
    } else {
      toast.error("Failed to copy value");
    }
  };

  const handleAddDomain = async () => {
    if (!domainForm.name.trim()) {
      toast.error("Please enter a domain name");
      return;
    }

    // Validate domain format (basic validation)
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domainForm.name.trim())) {
      toast.error("Please enter a valid domain name");
      return;
    }

    setIsLoading(true);
    try {
      const response = await domainAPI.upsertDomain({
        domainName: domainForm.name.trim(),
      });

      if (response.data.success) {
        // Show success message from backend (either "Domain added successfully" or "Domain updated successfully")
        const message = response.data.message || "Domain saved successfully";
        toast.success(message);
        
        const apiDomain = response.data.data as DomainApiResponse;
        const newDomain = mapApiDomainToDomain(apiDomain);

        // Replace the domain (user only has one domain)
        setDomains([newDomain]);
        
        // Update DNS records if they were included in the response
        if (apiDomain.dnsRecords && apiDomain.dnsRecords.length > 0) {
          const mappedRecords = apiDomain.dnsRecords.map(mapApiDnsRecordToDnsRecord);
          setDnsRecords(mappedRecords);
        } else {
          setDnsRecords([]);
        }

        setDomainForm({ name: "" });
        setIsAddDomainOpen(false);
        setIsEditDomainOpen(false);
        
        // Refresh domain data after adding/updating
        try {
          const getResponse = await domainAPI.getDomain();
          if (getResponse.data.success) {
            const apiDomain = getResponse.data.data as DomainApiResponse | null;
            if (apiDomain) {
              const domain = mapApiDomainToDomain(apiDomain);
              setDomains([domain]);
              if (apiDomain.dnsRecords && apiDomain.dnsRecords.length > 0) {
                const mappedRecords = apiDomain.dnsRecords.map(mapApiDnsRecordToDnsRecord);
                setDnsRecords(mappedRecords);
              } else {
                setDnsRecords([]);
              }
            }
          }
        } catch (refreshError) {
          console.error("Error refreshing domain:", refreshError);
        }
      } else {
        toast.error(response.data.message || "Failed to add domain");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to add domain";
      toast.error(errorMessage);
      console.error("Error adding domain:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDNSRecord = async () => {
    if (!dnsRecordForm.name.trim() || !dnsRecordForm.value.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if user has a domain
    if (!currentDomain) {
      toast.error("Please create a domain first before adding DNS records");
      return;
    }

    // Validate based on record type
    if (dnsRecordForm.type === "A") {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(dnsRecordForm.value.trim())) {
        toast.error("Please enter a valid IPv4 address for A record");
        return;
      }
    }

    if (dnsRecordForm.type === "CNAME" && !dnsRecordForm.value.includes(".")) {
      toast.error("Please enter a valid domain name for CNAME record");
      return;
    }

    if (dnsRecordForm.ttl < 60 || dnsRecordForm.ttl > 86400) {
      toast.error("TTL must be between 60 and 86400 seconds");
      return;
    }

    setIsLoading(true);
    try {
      const response = await domainAPI.createDNSRecord({
        domainId: parseInt(currentDomain.id, 10),
        type: dnsRecordForm.type,
        name: dnsRecordForm.name.trim(),
        value: dnsRecordForm.value.trim(),
        ttl: dnsRecordForm.ttl,
      });

      if (response.data.success) {
        toast.success(response.data.message || "DNS record added successfully");
        
        // Refresh domain data to get updated DNS records
        try {
          const getResponse = await domainAPI.getDomain();
          if (getResponse.data.success) {
            const apiDomain = getResponse.data.data as DomainApiResponse | null;
            if (apiDomain && apiDomain.dnsRecords) {
              const mappedRecords = apiDomain.dnsRecords.map(mapApiDnsRecordToDnsRecord);
              setDnsRecords(mappedRecords);
            }
          }
        } catch (refreshError) {
          console.error("Error refreshing DNS records:", refreshError);
        }

        setDnsRecordForm({
          type: "A",
          name: "",
          value: "",
          ttl: 3600,
        });
        setIsAddRecordOpen(false);
        setEditingRecordId(null);
      } else {
        toast.error(response.data.message || "Failed to add DNS record");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to add DNS record";
      toast.error(errorMessage);
      console.error("Error adding DNS record:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDNSRecord = (record: DNSRecord) => {
    setEditingRecordId(record.id);
    setDnsRecordForm({
      type: record.type,
      name: record.name,
      value: record.value,
      ttl: record.ttl,
    });
    setIsEditRecordOpen(true);
  };

  const handleUpdateDNSRecord = async () => {
    if (!editingRecordId || !currentDomain) {
      return;
    }

    if (!dnsRecordForm.name.trim() || !dnsRecordForm.value.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate based on record type
    if (dnsRecordForm.type === "A") {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(dnsRecordForm.value.trim())) {
        toast.error("Please enter a valid IPv4 address for A record");
        return;
      }
    }

    if (dnsRecordForm.type === "CNAME" && !dnsRecordForm.value.includes(".")) {
      toast.error("Please enter a valid domain name for CNAME record");
      return;
    }

    if (dnsRecordForm.ttl < 60 || dnsRecordForm.ttl > 86400) {
      toast.error("TTL must be between 60 and 86400 seconds");
      return;
    }

    setIsLoading(true);
    try {
      const response = await domainAPI.updateDNSRecord(parseInt(editingRecordId, 10), {
        type: dnsRecordForm.type,
        name: dnsRecordForm.name.trim(),
        value: dnsRecordForm.value.trim(),
        ttl: dnsRecordForm.ttl,
      });

      if (response.data.success) {
        toast.success(response.data.message || "DNS record updated successfully");
        
        // Refresh domain data to get updated DNS records
        try {
          const getResponse = await domainAPI.getDomain();
          if (getResponse.data.success) {
            const apiDomain = getResponse.data.data as DomainApiResponse | null;
            if (apiDomain && apiDomain.dnsRecords) {
              const mappedRecords = apiDomain.dnsRecords.map(mapApiDnsRecordToDnsRecord);
              setDnsRecords(mappedRecords);
            }
          }
        } catch (refreshError) {
          console.error("Error refreshing DNS records:", refreshError);
        }

        setDnsRecordForm({
          type: "A",
          name: "",
          value: "",
          ttl: 3600,
        });
        setEditingRecordId(null);
        setIsEditRecordOpen(false);
      } else {
        toast.error(response.data.message || "Failed to update DNS record");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update DNS record";
      toast.error(errorMessage);
      console.error("Error updating DNS record:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDNSRecord = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this DNS record?")) {
      return;
    }

    try {
      // TODO: Replace with actual API call
      // const apiBase = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
      // const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      // await fetch(`${apiBase}/api/dns-records/${recordId}`, {
      //   method: "DELETE",
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // });

      setDnsRecords(dnsRecords.filter((r) => r.id !== recordId));
      toast.success("DNS record deleted successfully");
    } catch (error) {
      toast.error("Failed to delete DNS record");
      console.error("Error deleting DNS record:", error);
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDomainOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Domain
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddRecordOpen(true)}
                disabled={!currentDomain}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8 space-y-6">
          {/* Loading State */}
          {isFetching && (
            <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
              <p className="text-neutral-600">Loading domain information...</p>
            </div>
          )}

          {/* Empty State - No Domain */}
          {!isFetching && !currentDomain && (
            <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Domain Configured</h3>
                <p className="text-sm text-neutral-600 mb-6">
                  Get started by adding your domain. This will allow you to manage DNS records and SSL certificates.
                </p>
                <Button onClick={() => setIsAddDomainOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your Domain
                </Button>
              </div>
            </div>
          )}

          {/* Domain Overview Card */}
          {!isFetching && currentDomain && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-neutral-900 mb-1">Domain</h3>
                  <p className="text-2xl text-neutral-900">{currentDomain.name}</p>
                </div>
                {currentDomain.sslActive ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    SSL Active
                  </Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    SSL Pending
                  </Badge>
                )}
              </div>

              {currentDomain.lastVerified && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Last Verified</p>
                    <p className="text-sm text-neutral-900">{currentDomain.lastVerified}</p>
                  </div>
                  {currentDomain.sslValidUntil && (
                    <div>
                      <p className="text-sm text-neutral-600 mb-1">SSL Certificate</p>
                      <p className="text-sm text-neutral-900">Valid until {currentDomain.sslValidUntil}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDomainForm({ name: currentDomain.name });
                    setIsEditDomainOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Domain
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("SSL recheck functionality coming soon")}
                >
                  Recheck SSL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("Certificate view functionality coming soon")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Certificate
                </Button>
              </div>
            </div>
          )}

          {/* DNS Records Table */}
          {!isFetching && currentDomain && (
            <div>
              <h3 className="text-neutral-900 mb-4">DNS Records</h3>
            {filteredDnsRecords.length === 0 ? (
              <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
                <p className="text-neutral-600">No DNS records found. Add your first record to get started.</p>
              </div>
            ) : (
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
                    {filteredDnsRecords.map((record) => (
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
                            title="Copy value"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900"
                            onClick={() => handleEditDNSRecord(record)}
                            title="Edit record"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteDNSRecord(record.id)}
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
            </div>
          )}

          {/* Custom Domain Instructions */}
          {!isFetching && currentDomain && (
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
          )}

        </div>
      </div>

      {/* Add Domain Dialog */}
      <Dialog open={isAddDomainOpen} onOpenChange={setIsAddDomainOpen}>
        <DialogContent className="sm:max-w-[500px]" style={{ width: "500px" }}>
          <DialogHeader>
            <DialogTitle>Add New Domain</DialogTitle>
            <DialogDescription>
              Enter the domain name you want to add to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain-name">Domain Name</Label>
              <Input
                id="domain-name"
                placeholder="example.com"
                value={domainForm.name}
                onChange={(e) => setDomainForm({ name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddDomain();
                  }
                }}
              />
              <p className="text-xs text-neutral-500">
                Enter the domain without http:// or https://
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDomainOpen(false);
                setDomainForm({ name: "" });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddDomain} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Domain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Domain Dialog */}
      <Dialog open={isEditDomainOpen} onOpenChange={setIsEditDomainOpen}>
        <DialogContent className="sm:max-w-[500px]" style={{ width: "500px" }}>
          <DialogHeader>
            <DialogTitle>Edit Domain</DialogTitle>
            <DialogDescription>
              Update your domain name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-domain-name">Domain Name</Label>
              <Input
                id="edit-domain-name"
                placeholder="example.com"
                value={domainForm.name}
                onChange={(e) => setDomainForm({ name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddDomain();
                  }
                }}
              />
              <p className="text-xs text-neutral-500">
                Enter the domain without http:// or https://
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDomainOpen(false);
                setDomainForm({ name: "" });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddDomain} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Domain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add DNS Record Dialog */}
      <Dialog open={isAddRecordOpen} onOpenChange={(open) => {
        setIsAddRecordOpen(open);
        if (!open) {
          setDnsRecordForm({ type: "A", name: "", value: "", ttl: 3600 });
          setEditingRecordId(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px]" style={{ width: "600px" }}>
          <DialogHeader>
            <DialogTitle>Add DNS Record</DialogTitle>
            <DialogDescription>
              Add a new DNS record for {currentDomain?.name || "your domain"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="record-type">Record Type</Label>
              <Select
                value={dnsRecordForm.type}
                onValueChange={(value: "A" | "CNAME" | "TXT" | "MX" | "NS" | "SRV") =>
                  setDnsRecordForm({ ...dnsRecordForm, type: value })
                }
              >
                <SelectTrigger id="record-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A (IPv4 Address)</SelectItem>
                  <SelectItem value="CNAME">CNAME (Canonical Name)</SelectItem>
                  <SelectItem value="TXT">TXT (Text Record)</SelectItem>
                  <SelectItem value="MX">MX (Mail Exchange)</SelectItem>
                  <SelectItem value="NS">NS (Name Server)</SelectItem>
                  <SelectItem value="SRV">SRV (Service Record)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="record-name">Name</Label>
              <Input
                id="record-name"
                placeholder={dnsRecordForm.type === "A" ? "@ or subdomain" : "Record name"}
                value={dnsRecordForm.name}
                onChange={(e) => setDnsRecordForm({ ...dnsRecordForm, name: e.target.value })}
              />
              <p className="text-xs text-neutral-500">
                Use @ for root domain, or enter a subdomain (e.g., www, mail)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="record-value">Value</Label>
              <Input
                id="record-value"
                placeholder={
                  dnsRecordForm.type === "A"
                    ? "192.168.1.1"
                    : dnsRecordForm.type === "CNAME"
                    ? "example.com"
                    : dnsRecordForm.type === "TXT"
                    ? "v=spf1 include:_spf.example.com ~all"
                    : "mail.example.com"
                    
                }
                value={dnsRecordForm.value}
                onChange={(e) => setDnsRecordForm({ ...dnsRecordForm, value: e.target.value })}
              />
              <p className="text-xs text-neutral-500">
                {dnsRecordForm.type === "A" && "Enter an IPv4 address (e.g., 192.168.1.1)"}
                {dnsRecordForm.type === "CNAME" && "Enter a domain name (e.g., example.com)"}
                {dnsRecordForm.type === "TXT" && "Enter text content (e.g., SPF, DKIM records)"}
                {dnsRecordForm.type === "MX" && "Enter mail server hostname"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="record-ttl">TTL (Time To Live)</Label>
              <Input
                id="record-ttl"
                type="number"
                min="60"
                max="86400"
                value={dnsRecordForm.ttl}
                onChange={(e) =>
                  setDnsRecordForm({ ...dnsRecordForm, ttl: parseInt(e.target.value) || 3600 })
                }
              />
              <p className="text-xs text-neutral-500">
                Time in seconds (60-86400). Default is 3600 (1 hour).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddRecordOpen(false);
                setDnsRecordForm({
                  type: "A",
                  name: "",
                  value: "",
                  ttl: 3600,
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddDNSRecord} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit DNS Record Dialog */}
      <Dialog open={isEditRecordOpen} onOpenChange={(open) => {
        setIsEditRecordOpen(open);
        if (!open) {
          setDnsRecordForm({ type: "A", name: "", value: "", ttl: 3600 });
          setEditingRecordId(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px]" style={{ width: "600px" }}>
          <DialogHeader>
            <DialogTitle>Edit DNS Record</DialogTitle>
            <DialogDescription>
              Update DNS record for {currentDomain?.name || "your domain"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-record-type">Record Type</Label>
              <Select
                value={dnsRecordForm.type}
                onValueChange={(value: "A" | "CNAME" | "TXT" | "MX" | "NS" | "SRV") =>
                  setDnsRecordForm({ ...dnsRecordForm, type: value })
                }
              >
                <SelectTrigger id="edit-record-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A (IPv4 Address)</SelectItem>
                  <SelectItem value="CNAME">CNAME (Canonical Name)</SelectItem>
                  <SelectItem value="TXT">TXT (Text Record)</SelectItem>
                  <SelectItem value="MX">MX (Mail Exchange)</SelectItem>
                  <SelectItem value="NS">NS (Name Server)</SelectItem>
                  <SelectItem value="SRV">SRV (Service Record)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-record-name">Name</Label>
              <Input
                id="edit-record-name"
                placeholder={dnsRecordForm.type === "A" ? "@ or subdomain" : "Record name"}
                value={dnsRecordForm.name}
                onChange={(e) => setDnsRecordForm({ ...dnsRecordForm, name: e.target.value })}
              />
              <p className="text-xs text-neutral-500">
                Use @ for root domain, or enter a subdomain (e.g., www, mail)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-record-value">Value</Label>
              <Input
                id="edit-record-value"
                placeholder={
                  dnsRecordForm.type === "A"
                    ? "192.168.1.1"
                    : dnsRecordForm.type === "CNAME"
                    ? "example.com"
                    : dnsRecordForm.type === "TXT"
                    ? "v=spf1 include:_spf.example.com ~all"
                    : dnsRecordForm.type === "MX"
                    ? "mail.example.com"
                    : dnsRecordForm.type === "NS"
                    ? "ns1.example.com"
                    : "service.example.com"
                }
                value={dnsRecordForm.value}
                onChange={(e) => setDnsRecordForm({ ...dnsRecordForm, value: e.target.value })}
              />
              <p className="text-xs text-neutral-500">
                {dnsRecordForm.type === "A" && "Enter an IPv4 address (e.g., 192.168.1.1)"}
                {dnsRecordForm.type === "CNAME" && "Enter a domain name (e.g., example.com)"}
                {dnsRecordForm.type === "TXT" && "Enter text content (e.g., SPF, DKIM records)"}
                {dnsRecordForm.type === "MX" && "Enter mail server hostname"}
                {dnsRecordForm.type === "NS" && "Enter name server hostname"}
                {dnsRecordForm.type === "SRV" && "Enter service record value"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-record-ttl">TTL (Time To Live)</Label>
              <Input
                id="edit-record-ttl"
                type="number"
                min="60"
                max="86400"
                value={dnsRecordForm.ttl}
                onChange={(e) =>
                  setDnsRecordForm({ ...dnsRecordForm, ttl: parseInt(e.target.value) || 3600 })
                }
              />
              <p className="text-xs text-neutral-500">
                Time in seconds (60-86400). Default is 3600 (1 hour).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditRecordOpen(false);
                setDnsRecordForm({
                  type: "A",
                  name: "",
                  value: "",
                  ttl: 3600,
                });
                setEditingRecordId(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateDNSRecord} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
