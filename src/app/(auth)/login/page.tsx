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
        <img src="/logo.webp" alt="StepMeal" className="w-32 h-32 mx-auto mb-2 object-contain" />
        <p className="mt-1 text-[var(--color-text-muted)] text-sm">움직임이 선물하는 건강한 한끼</p>
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
