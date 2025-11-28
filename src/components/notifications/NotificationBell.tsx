import React from 'react';
import { Bell, XCircle, CheckCircle, Info, AlertTriangle, FileText, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/components/notifications/NotificationsProvider';
import { Notification } from '@/types/database';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const getIconForNotificationType = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-medical-success" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-medical-warning" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-medical-info" />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    setOpen(false); // Close dialog after clicking a notification

    if (notification.action) {
      switch (notification.action.type) {
        case 'view_report':
          navigate(`/reports?reportId=${notification.action.payload}`);
          break;
        case 'view_prescription':
          navigate(`/prescriptions?prescriptionId=${notification.action.payload}`);
          break;
        case 'view_xray': // If we want to view the X-ray directly, might redirect to report page
          navigate(`/reports?reportId=${notification.action.payload}`);
          break;
        case 'update_profile':
          navigate('/profile'); // Assuming a profile page exists
          break;
        default:
          break;
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>
            You have {unreadCount} unread messages.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="flex justify-end p-4">
          <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
            Mark all as read
          </Button>
        </div>
        <ScrollArea className="h-[300px] px-6">
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                    notification.read ? "bg-muted/30 text-muted-foreground" : "bg-card hover:bg-secondary/50",
                    notification.action && "hover:bg-accent/10"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getIconForNotificationType(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className={cn("font-medium", notification.read && "text-muted-foreground")}>
                      {notification.title}
                    </h4>
                    <p className={cn("text-sm", notification.read ? "text-muted-foreground" : "text-foreground/80")}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.createdAt.toDate().toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="p-6 pt-4">
          <Button onClick={() => setOpen(false)} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationBell;