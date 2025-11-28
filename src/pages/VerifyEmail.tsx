import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck, ArrowRight, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { user, isLoading, refetchUser } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Effect to check verification status and redirect
  useEffect(() => {
    if (!isLoading) {
      if (user?.emailVerified) {
        console.log("VerifyEmail: User is verified, navigating to dashboard.");
        navigate('/dashboard', { replace: true });
      } else if (!user) {
        console.log("VerifyEmail: No user logged in, navigating to login.");
        navigate('/login', { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  // Periodically check verification status if user is present but not verified
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isLoading && user && !user.emailVerified) {
      console.log("VerifyEmail: Setting up periodic check for email verification.");
      interval = setInterval(() => {
        console.log("VerifyEmail: Performing periodic refetch to check email verification status.");
        refetchUser();
      }, 5000); // Check every 5 seconds
    }
    return () => {
      if (interval) {
        console.log("VerifyEmail: Clearing periodic check interval.");
        clearInterval(interval);
      }
    };
  }, [isLoading, user, refetchUser]);


  const handleResendVerification = async () => {
    if (!auth?.currentUser) {
      toast({
        title: 'Error',
        description: 'No active user to resend verification email.',
        variant: 'destructive',
      });
      return;
    }

    setIsResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: 'Verification Email Sent',
        description: 'A new verification email has been sent to your inbox.',
      });
      setResendCooldown(60);
      // After resending, immediately refetch user to update local state
      await refetchUser(); 
    } catch (error) {
      console.error('Error resending verification email:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend verification email. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToLogin = async () => {
    // Before navigating to login, refetch user to ensure latest status is reflected
    await refetchUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen medical-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card text-center">
        <CardHeader className="space-y-1">
          <MailCheck className="h-16 w-16 mx-auto text-primary mb-4" />
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            A verification link has been sent to your email address. Please check your inbox (and spam folder) to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            After verifying your email, you can proceed to log in.
          </p>
          <Button 
            onClick={handleResendVerification} 
            className="w-full" 
            variant="outline"
            disabled={isResending || resendCooldown > 0 || isLoading}
          >
            <Send className="mr-2 h-4 w-4" />
            {isResending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
          </Button>
          <Button onClick={handleGoToLogin} className="w-full" disabled={isLoading}>
            Go to Login <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;