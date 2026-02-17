"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else {
        router.push("/home");
        router.refresh();
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/15 border-2 border-[var(--color-primary)]/30 flex items-center justify-center mx-auto mb-4">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="10" r="4" fill="#22C55E" fillOpacity="0.6"/>
            <path d="M18 15V24L14 32M18 24L22 32" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M12 19L18 17L24 19" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gradient-green">StepMeal</h1>
        <p className="mt-2 text-[var(--color-text-muted)] text-sm">움직여서 벌고, 건강하게 먹자</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="이메일"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="비밀번호"
          type="password"
          placeholder="비밀번호 입력"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
          로그인
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--color-text-muted)]">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="text-[var(--color-primary)] font-semibold">
          회원가입
        </Link>
      </p>
    </div>
  );
}
