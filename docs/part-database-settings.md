# คู่มือการตั้งค่า Part / Database

เอกสารนี้ใช้สำหรับตั้งค่าให้ระบบ AdaPos+ Mobile Stock & Price ใช้งานหลายฐานข้อมูล โดยแยกฐานข้อมูลตาม `Part` ใน URL

ตัวอย่างแนวคิด:

```text
/AdaCheckStockSTD  ->  AdaAccSTD_ByAgent
/AdaCheckStockAgn  ->  AdaAccSTD-Agn
/AdaCheckStockUAT  ->  AdaAccUAT_ByAgent
```

## 1. สิ่งที่ต้องเตรียมก่อนตั้งค่า

เตรียมข้อมูลของฐานข้อมูลแต่ละชุด:

| ข้อมูล | ตัวอย่าง | หมายเหตุ |
| --- | --- | --- |
| Part | `AdaCheckStockSTD` | ใช้เป็น path หน้าเว็บ เช่น `/AdaCheckStockSTD/login` |
| Database | `AdaAccSTD_ByAgent` | ชื่อฐานข้อมูล SQL Server |
| IP/Server | `27.254.239.245` | IP หรือชื่อ server ของ SQL Server |
| Port | `33433` | ถ้าเป็น SQL Server ปกติอาจเป็น `1433` |
| User Database | `sa` | user สำหรับเชื่อมต่อฐานข้อมูล |
| Password Database | รหัสผ่าน DB | ไม่แสดงกลับในหน้ารายการหลังบันทึก |

Server ที่รันเว็บต้องเชื่อมต่อ IP/Port ของฐานข้อมูลได้ ถ้ามี firewall ต้อง whitelist IP ของ server เว็บก่อน

## 2. เข้าไปหน้าตั้งค่า

เปิดหน้า:

```text
https://mobile-check.makhamlab.com/setting
```

สำหรับเครื่อง local:

```text
http://localhost:3001/setting
```

ใส่บัญชีผู้ดูแลระบบ:

```text
Admin User: 009
Admin Password: 12345678
```

หมายเหตุ: ใน production ค่านี้อ่านจาก `.env.local`

```env
SETTINGS_ADMIN_USER=009
SETTINGS_ADMIN_PASSWORD=12345678
```

## 3. รายการที่แสดงบนหน้า Setting

หลังเข้าสู่หน้าตั้งค่า ระบบจะแสดงรายการ Part/Database ที่มีอยู่แล้วในรูปแบบ row โดยมีคอลัมน์หลัก:

| คอลัมน์ | ความหมาย |
| --- | --- |
| ลำดับ | เลขลำดับรายการ |
| Part | path ที่ใช้เปิดระบบ |
| IP/Server | server ของฐานข้อมูล |
| Port | port ของฐานข้อมูล |
| Database | ชื่อฐานข้อมูล |
| User | user ที่ใช้เชื่อมต่อ |
| Password | แสดงว่า `ตั้งค่าแล้ว` หรือว่าง แต่ไม่แสดงรหัสผ่านจริง |
| จัดการ | ปุ่ม `แก้ไข` และ `ลบ` |

## 4. การเพิ่ม Part / Database ใหม่

1. เข้า `/setting`
2. Login ด้วย admin
3. กดปุ่ม `เพิ่ม`
4. กรอกข้อมูลให้ครบ
5. กด `บันทึก`
6. ทดสอบเปิด URL ของ Part ใหม่

ตัวอย่าง:

```text
Part: AdaCheckStockAgn
Database: AdaAccSTD-Agn
IP/Server Database: 27.254.239.245
Port: 33433
User Database: sa
Password Database: ********
```

หลังบันทึก ให้ทดสอบ:

```text
https://mobile-check.makhamlab.com/AdaCheckStockAgn/login
```

ถ้าตั้งค่าถูกต้อง ระบบต้องอยู่ที่ `/AdaCheckStockAgn/login` และหลัง login ต้องเข้า `/AdaCheckStockAgn/main` ไม่ redirect ไป STD

## 5. การแก้ไข Part / Database

1. เข้า `/setting`
2. Login ด้วย admin
3. กด `แก้ไข` ที่ row ที่ต้องการ
4. แก้ไขค่า Part, Database, IP/Server, Port หรือ User
5. ถ้าต้องการเปลี่ยน password ให้กรอก password ใหม่
6. ถ้าไม่ต้องการเปลี่ยน password ให้ปล่อยช่อง password ว่างไว้
7. กด `บันทึก`

พฤติกรรมของ password:

- หน้า list จะไม่แสดง password จริง
- ถ้าแก้ไขแล้วไม่กรอก password ใหม่ ระบบจะใช้ password เดิม
- ถ้าเพิ่ม Part ใหม่และไม่กรอก password ระบบจะ fallback ไปใช้ `PASSWORD_DB` จาก env

## 6. การลบ Part / Database

1. เข้า `/setting`
2. Login ด้วย admin
3. กด `ลบ` ที่ row ที่ต้องการ
4. ยืนยันการลบ

หลังลบแล้ว URL ของ Part นั้นจะไม่ควรใช้งานต่อ เช่น:

```text
/AdaCheckStockOld/login
```

ถ้าผู้ใช้ยังเปิด path เดิมอยู่ ให้แจ้งให้เปลี่ยนไปใช้ Part ที่ยังมีในระบบ

## 7. กฎการตั้งชื่อ

### Part

ใช้ได้เฉพาะ:

```text
A-Z, a-z, 0-9, _, -
```

ตัวอย่างที่ถูกต้อง:

```text
AdaCheckStockSTD
AdaCheckStockAgn
AdaCheckStock_UAT
AdaCheckStock-Branch01
```

ไม่ต้องใส่ `/` นำหน้า

```text
ถูก: AdaCheckStockAgn
ผิด: /AdaCheckStockAgn
```

ชื่อที่ห้ามใช้ เพราะชนกับ route ของระบบ:

```text
_next
api
favicon.ico
icons
login
main
manifest.json
price-check
receive
setting
stock
sw.js
test-network.ts
transfer
```

### Database

ใช้ได้เฉพาะ:

```text
A-Z, a-z, 0-9, _, -
```

ตัวอย่าง:

```text
AdaAccSTD_ByAgent
AdaAccSTD-Agn
```

## 8. การเก็บค่าในระบบ

ค่าที่ตั้งจากหน้า `/setting` ถูกเก็บฝั่ง server ที่:

```text
/app/.runtime/database-paths.json
```

ถ้ารันด้วย Docker ค่านี้อยู่ใน Docker volume:

```text
adapos_runtime
```

ดังนั้นเมื่อ recreate container ด้วย compose เดิม ค่า setting จะยังอยู่ ไม่หาย

## 9. ลำดับการเลือกค่า Database

เมื่อ API ถูกเรียกจาก path เช่น:

```text
/AdaCheckStockAgn/api/query/selectUsrLogin
```

ระบบจะหา config ตาม `Part` นี้:

```text
AdaCheckStockAgn
```

ลำดับค่า config:

1. ค่าที่บันทึกจากหน้า `/setting`
2. ค่าใน env `DATABASE_NAME_BY_PATH`
3. ค่า default จาก env หลัก เช่น `NAME_DB`, `SERVER_DB`, `PORT_DB`, `USER_DB`, `PASSWORD_DB`

ค่าจาก `/setting` จะ override ค่าใน env ถ้าใช้ Part เดียวกัน

## 10. การตั้งค่าผ่าน env

สามารถตั้งค่าเริ่มต้นผ่าน `.env.local` ได้:

```env
DATABASE_NAME_BY_PATH={"AdaCheckStockSTD":"AdaAccSTD_ByAgent","AdaCheckStockAgn":{"database":"AdaAccSTD-Agn","server":"27.254.239.245","port":33433,"user":"sa","password":"your_password"}}
```

รูปแบบสั้น:

```json
{
  "AdaCheckStockSTD": "AdaAccSTD_ByAgent"
}
```

รูปแบบเต็ม:

```json
{
  "AdaCheckStockAgn": {
    "database": "AdaAccSTD-Agn",
    "server": "27.254.239.245",
    "port": 33433,
    "user": "sa",
    "password": "your_password"
  }
}
```

สำหรับ production แนะนำตั้งค่าจากหน้า `/setting` เพื่อแก้ไขได้โดยไม่ต้อง rebuild image

## 11. Checklist หลังตั้งค่า

หลังเพิ่มหรือแก้ไข Part ให้ตรวจตามนี้:

1. เปิดหน้า login ของ Part นั้นได้

```text
https://mobile-check.makhamlab.com/<Part>/login
```

2. URL ไม่ redirect ไป Part อื่น
3. Login ด้วย user ทดสอบได้
4. หลัง login เข้า `/main` แล้วเมนูด้านซ้ายแสดง
5. ชื่อผู้ใช้/บริษัท/สาขาแสดงถูกกับฐานข้อมูลนั้น
6. ทดสอบเมนูที่ต้อง query DB เช่น ตรวจสอบราคา หรือรับสินค้า

## 12. ปัญหาที่พบบ่อย

### เปิด `/AdaCheckStockAgn/login` แล้วเด้งไป `/AdaCheckStockSTD/login`

สาเหตุที่เป็นไปได้:

- Part ยังไม่ได้ถูกเพิ่มใน `/setting`
- Part ถูกสะกดไม่ตรงกัน
- Browser cache/service worker เก่าค้าง

แนวทางแก้:

- ตรวจว่ามี `AdaCheckStockAgn` ในหน้า `/setting`
- ลอง refresh หน้า หรือ clear site data ใน browser
- ตรวจ URL ว่าใช้ตัวพิมพ์ตรงกัน

### Login แล้วขึ้น error หรือเข้าไม่ได้

สาเหตุที่เป็นไปได้:

- Database name ผิด
- IP/Server หรือ Port ต่อไม่ได้
- User/Password database ผิด
- Database ไม่มี user ที่ใช้ login
- Schema ตารางไม่ตรงกับระบบ

แนวทางแก้:

- ตรวจ firewall และ port จาก server เว็บไป DB
- ตรวจ user/password DB
- ตรวจว่าฐานข้อมูลมีตารางชุดเดียวกับระบบ AdaPos
- ลองใช้ user `009` / password `12345678` กับ DB ทดสอบ

### หน้า setting แสดง Password ว่า `ตั้งค่าแล้ว` แต่ไม่เห็นรหัสผ่าน

เป็นพฤติกรรมปกติ ระบบไม่ส่ง password จริงกลับไปหน้าเว็บเพื่อความปลอดภัย

### แก้ไขรายการแล้วไม่อยากเปลี่ยน password

ปล่อยช่อง `Password Database` ว่างไว้ แล้วกด `บันทึก` ระบบจะใช้ password เดิม

### เพิ่ม Part ใหม่แล้วไม่กรอก password

ระบบจะใช้ `PASSWORD_DB` จาก env ถ้า password ของ database ใหม่นั้นไม่ตรงกับ env ต้องกรอก password จริงตอนเพิ่ม

## 13. ข้อควรระวัง

- ทุก database ที่ใช้กับระบบนี้ควรมี schema เหมือนกัน
- ถ้าใช้หลาย IP/Server ต้องให้ server เว็บเชื่อมต่อทุก IP/Port ได้
- อย่าใช้ชื่อ Part ที่ชนกับ route ของระบบ
- อย่า commit `.env.local` หรือ password จริงขึ้น Git
- หลังเปลี่ยน config ระบบจะ clear database pool เดิมและสร้าง connection ใหม่ตาม config ล่าสุด
