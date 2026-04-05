// src/components/shared/Settings.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { User, Lock, Bell, Shield, Save, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useBranchSettings } from "@/hooks/useBranchSettings";

interface SettingsProps {
  role: "superadmin" | "company" | "branch";
}

const Settings = ({ role }: SettingsProps) => {
  // ONLY initialize the hook that matches the role
  const superAdminHook = role === 'superadmin' ? useSettings(role) : null;
  const companyHook = role === 'company' ? useCompanySettings() : null;
  const branchHook = role === 'branch' ? useBranchSettings() : null;
  
  // Select the correct hook data based on role
  const hookData = 
    role === 'company' ? companyHook! : 
    role === 'branch' ? branchHook! : 
    superAdminHook!;
  
  const { 
    profile, 
    notifications, 
    loading, 
    roleLabel, 
    initials,
    updateProfile, 
    changePassword, 
    updateNotifications,
    deleteAccount 
  } = hookData;
  
  const { toast } = useToast();

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Notification preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(true);
  const [lowBalanceAlert, setLowBalanceAlert] = useState(true);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  // Update notification state when notifications load
  useEffect(() => {
    if (notifications) {
      setEmailNotifs(notifications.email_notifications);
      setSmsNotifs(notifications.sms_notifications);
      setLowBalanceAlert(notifications.low_balance_alerts);
    }
  }, [notifications]);

  const handleProfileSave = async () => {
    try {
      await updateProfile({ full_name: fullName, email, phone });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ 
        title: "Error", 
        description: "Please fill in all password fields.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({ 
        title: "Error", 
        description: "New password must be at least 8 characters.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({ 
        title: "Error", 
        description: "New passwords do not match.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleNotificationSave = async () => {
    try {
      await updateNotifications({
        email_notifications: emailNotifs,
        sms_notifications: smsNotifs,
        low_balance_alerts: lowBalanceAlert
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await deleteAccount();
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  if (loading.profile && !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account preferences and security</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold bg-accent text-accent-foreground">
                  {initials}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{fullName || roleLabel}</p>
                  <p className="text-sm text-muted-foreground">{roleLabel}</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    disabled={loading.update}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    disabled={loading.update}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="+254 700 000 000"
                    disabled={loading.update}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={roleLabel} disabled className="bg-muted" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleProfileSave} 
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={loading.update}
                >
                  {loading.update ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Change Password</CardTitle>
              <CardDescription>Ensure your account stays secure by using a strong password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-w-md space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      disabled={loading.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={loading.password}
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      disabled={loading.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={loading.password}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={loading.password}
                  />
                </div>

                {newPassword && (
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center gap-1.5 ${newPassword.length >= 8 ? "text-green-600" : "text-muted-foreground"}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> At least 8 characters
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(newPassword) ? "text-green-600" : "text-muted-foreground"}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> One uppercase letter
                    </div>
                    <div className={`flex items-center gap-1.5 ${/[0-9]/.test(newPassword) ? "text-green-600" : "text-muted-foreground"}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> One number
                    </div>
                    <div className={`flex items-center gap-1.5 ${newPassword === confirmPassword && confirmPassword ? "text-green-600" : "text-muted-foreground"}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handlePasswordChange} 
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={loading.password}
                >
                  {loading.password ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Permanently remove your account and all data</p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={loading.delete}
                >
                  {loading.delete ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Account'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
              <CardDescription>Choose how you receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates and reports via email</p>
                </div>
                <Switch 
                  checked={emailNotifs} 
                  onCheckedChange={setEmailNotifs}
                  disabled={loading.notifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">SMS Notifications</p>
                  <p className="text-xs text-muted-foreground">Get critical alerts via SMS</p>
                </div>
                <Switch 
                  checked={smsNotifs} 
                  onCheckedChange={setSmsNotifs}
                  disabled={loading.notifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Low Balance Alerts</p>
                  <p className="text-xs text-muted-foreground">Get notified when wallet balance is below KES 500</p>
                </div>
                <Switch 
                  checked={lowBalanceAlert} 
                  onCheckedChange={setLowBalanceAlert}
                  disabled={loading.notifications}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleNotificationSave}
                  disabled={loading.notifications}
                  className="gap-2"
                >
                  {loading.notifications ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
