"use client";
// import { useAuth } from "@/hooks/useAuth";
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // ตัวอย่างการเรียก API จริงจะต้องทำการเชื่อมต่อกับ backend
      // const response = await fetch('/api/auth/forgot-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // });
      
      // จำลองการเรียก API (ลบทิ้งเมื่อใช้ API จริง)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // if (!response.ok) throw new Error('อีเมลไม่ถูกต้องหรือไม่พบในระบบ');
      setIsSuccess(true);
      
    } catch (error) {
      setErrorMessage((error as Error).message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="bg-blue-500 text-white text-2xl font-bold flex items-center justify-center w-16 h-16 rounded-md">
          Ada
        </div>
        <h2 className="text-2xl font-bold mt-4">AdaPos+ Stock & Price</h2>
      </div>
      
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-2 text-center">ลืมรหัสผ่าน</h3>
        <p className="text-gray-500 text-center mb-6">กรอกอีเมลของคุณ เพื่อรีเซ็ตรหัสผ่าน</p>
        
        {isSuccess ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            <p className="text-center">ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว</p>
            <p className="text-center text-sm mt-1">กรุณาตรวจสอบอีเมลของคุณเพื่อดำเนินการต่อ</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="กรุณากรอกอีเมล"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {errorMessage}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-blue-500 text-white py-2 px-4 rounded-md font-medium ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'
              }`}
            >
              {isSubmitting ? 'กำลังดำเนินการ...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <Link href="/login" className="text-blue-500 hover:text-blue-700 text-sm">
            กลับไปยังหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}