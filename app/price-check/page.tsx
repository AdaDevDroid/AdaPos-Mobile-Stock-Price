"use client";
import { useAuth } from "@/hooks/useAuth";
import React, { useEffect, useState } from 'react';

interface User {
  FTUsrCode: string;
  FTUsrLogin: string | null;
  FTUsrName: string | null;
  FTUsrLogType: string | null;
  FTUsrLoginPwd: string | null;
  FTUsrStaActive: string | null;
  FDUsrPwdStart: Date | null;
  FDUsrPwdExpired: Date | null;
}

export default function PriceCheckPage() {
  // เช็ค user login
  useAuth();

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/query/users');
      const data = await response.json();
      // Format date fields to a consistent string format
      const formattedData = data.map((user: User) => ({
        ...user,
        FDUsrPwdStart: user.FDUsrPwdStart ? new Date(user.FDUsrPwdStart).toISOString() : null,
        FDUsrPwdExpired: user.FDUsrPwdExpired ? new Date(user.FDUsrPwdExpired).toISOString() : null,
      }));
      setUsers(data);
    }

    fetchData();
  }, []);

  console.log(users);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="bg-blue-500 text-white text-2xl font-bold flex items-center justify-center w-16 h-16 rounded-md">
          Ada
        </div>
        <h2 className="text-2xl font-bold mt-4">AdaPos+ Stock & Price</h2>
        <h3 className="text-2xl mt-4">PriceCheckPage</h3>
        <p className="text-gray-500">เข้าสู่หน้า PriceCheckPage</p>
      </div>
      <div className="w-full ">
        <h3 className="text-xl font-bold mb-4">User List 2</h3>
        <ul className="bg-white shadow-md rounded-lg p-4">
          {users.map((user, index) => (
            <li key={index} className="border-b last:border-none py-2">
              <p><strong>UserCode:</strong> {user.FTUsrCode}</p>
              <p><strong>UserLogin:</strong> {user.FTUsrLogin}</p>
              <p><strong>UserName:</strong> {user.FTUsrName}</p>
              <p><strong>FTUsrLogType:</strong> {user.FTUsrLogType}</p>
              <p><strong>FTUsrLoginPwd:</strong> {user.FTUsrLoginPwd}</p>
              <p><strong>FTUsrStaActive:</strong> {user.FTUsrStaActive}</p>
              <p><strong>UsrPwdStart:</strong> {user.FDUsrPwdStart ? new Date(user.FDUsrPwdStart).toLocaleString() : 'N/A'}</p>
              <p><strong>FDUsrPwdExpired:</strong> {user.FDUsrPwdExpired ? new Date(user.FDUsrPwdExpired).toLocaleString() : 'N/A'}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}