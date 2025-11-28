import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MailCheck, LogOut, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useState } from 'react';

const EmailVerificationRequired = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUserToken, isLoading } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  const handleResendVerificationEmail = async () => {
    if (!auth?.currentUser) {
      toast({
        title: 'Error',
        description: 'No active user session found. Please log in again.',
        variant: 'destructive',
      });
      logout();
      navigate('/login');
      return;
    }

    setIsResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: 'Verification Email Sent',
        description: 'A new verification email has been sent to your inbox. Please check your spam folder.',
      });
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      toast({
        title: 'Error Resending Email',
        description: error.message || 'Failed to resend verification email. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerificationStatus = async () => {
    if (!auth?.currentUser) {
      toast({
        title: 'Error',
        description: 'No active user session found. Please log in again.',
        variant: 'destructive',
      });
      logout();
      navigate('/login');
      return;
    }

    try {
      await refreshUserToken(); // This will reload the user and update the emailVerified status in AuthContext
      if (user?.emailVerified) {
        toast({
          title: 'Email Verified!',
          description: 'Your email has been successfully verified. Redirecting to dashboard...',
        });
        navigate('/dashboard', { replace: true });
      } else {
        toast({
          title: 'Still Not Verified',
          description: 'Your email is still not verified. Please check your inbox or resend the email.',
          variant: 'warning',
        });
      }
    } catch (error: any) {
      console.error('Error checking verification status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check verification status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen medical-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card text-center">
        <CardHeader className="space-y-1">
          <MailCheck className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            A verification email has been sent to <span className="font-medium text-primary">{user?.email}</span>.
            Please check your inbox (and spam folder) to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleCheckVerificationStatus}
            className="w-full"
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {isLoading ? 'Checking...' : 'I have verified my email'}
          </Button>
          <Button
            variant="outline"
            onClick={handleResendVerificationEmail}
            className="w-full"
            disabled={isResending || isLoading}
          >
            {isResending ? 'Resending...' : 'Resend Verification Email'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full text-muted-foreground"
            disabled={isLoading}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationRequired;