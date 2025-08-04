"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { BooksphereLogo } from "../../components/ui/icons/BooksphereLogo";
import { Stack } from "../../components/primitives";
import { supabase } from "../../lib/supabase";
import type { FC, FormEvent } from "react";

const LoginPage: FC = () => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const router = useRouter();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) {
            setError(error.message || "Sign in failed. Please try again.");
        } else {
            router.push("/inventory");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-page flex items-center justify-center p-md relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-50" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full blur-3xl opacity-30" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full blur-3xl opacity-30" />
            
            <Card className="w-full max-w-md shadow-elevation-5 border-0 relative z-10 hover-scale-sm animate-spring backdrop-blur-sm">
                <CardHeader className="text-center">
                    <Stack gap="md" align="center">
                        <div className="p-3 rounded-full bg-gradient-to-r from-primary to-secondary shadow-elevation-2">
                            <BooksphereLogo size={48} className="text-white" />
                        </div>
                        <Stack gap="xs">
                            <CardTitle className="text-3xl font-bold tracking-tight gradient-text">Booksphere</CardTitle>
                            <CardDescription className="text-base">Sign in to your account</CardDescription>
                        </Stack>
                    </Stack>
                </CardHeader>
                <CardContent>
                    <form id="login-form" onSubmit={handleSubmit}>
                        <Stack gap="lg">
                            <Stack gap="xs">
                                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    disabled={loading}
                                    data-testid="email-input"
                                    className="text-base"
                                />
                            </Stack>
                            <Stack gap="xs">
                                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    disabled={loading}
                                    data-testid="password-input"
                                    className="text-base"
                                />
                            </Stack>
                            {error && (
                                <div className="text-destructive text-sm bg-destructive/10 p-sm rounded-md border border-destructive/20" role="alert">
                                    {error}
                                </div>
                            )}
                            <Button 
                                className="w-full" 
                                type="submit" 
                                disabled={loading} 
                                aria-busy={loading} 
                                data-testid="login-button"
                                size="lg"
                            >
                                {loading ? "Signing In..." : "Sign In"}
                            </Button>
                        </Stack>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage; 