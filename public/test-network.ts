export default function handler( res: { status: (arg0: number) => { (): any; new(): any; end: { (): void; new(): any; }; }; }) {
    res.status(200).end(); // ส่ง response 200 OK กลับไป
  }