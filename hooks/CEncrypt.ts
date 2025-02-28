import * as crypto from 'crypto';
import { Buffer } from 'buffer';

export class CEncrypt {
  private tC_Key: string;
  private tC_IV: string;

  constructor(ptMode: string) { 
    // 1: Normal, 2: Password
      if (ptMode === "1") {
          // Key มาตรฐาน
          this.tC_Key = "BJHhj?AW=c7-4#vF";
          this.tC_IV = "bh_B4Hu?L4@CV6pb";
      } else {
          // Password
          this.tC_Key = "5YpPTypXtwMML$u@";
          this.tC_IV = "zNhQ$D%arP6U8waL";
      }
  }

  // แปลงคีย์และ IV เป็น Buffer
  private C_GETaKeyBytes(key: string): Buffer {
      return Buffer.from(key, 'utf-8');
  }

  // เข้ารหัสข้อมูลด้วย AES128
  private C_DATaEncrypt(plainTextBytes: Buffer, keyBytes: Buffer, ivBytes: Buffer): Buffer {
      const cipher = crypto.createCipheriv('aes-128-cbc', keyBytes, ivBytes);
      const encrypted = Buffer.concat([cipher.update(plainTextBytes), cipher.final()]);
      return encrypted;
  }

  // ฟังก์ชันเข้ารหัสหลัก
  public C_PWDtASE128Encrypt(ptPlainText: string): string {
      const aPlainTextBytes = Buffer.from(ptPlainText, 'utf-8');
      const aKeyBytes = this.C_GETaKeyBytes(this.tC_Key);
      const aIVBytes = this.C_GETaKeyBytes(this.tC_IV);

      const encryptedBytes = this.C_DATaEncrypt(aPlainTextBytes, aKeyBytes, aIVBytes);
      return encryptedBytes.toString('base64');
  }
}