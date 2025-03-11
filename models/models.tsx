export interface Product {
    FNId: number;
    FTBarcode: string;
    FCCost: number;
    FNQuantity: number;
    FTRefDoc: string;
    FTRefSeq: string;
}

export interface History {
    FTDate: string;
    FTRefDoc: string;
    FNStatus: number;
    FTRefSeq: string;
}

export interface UserInfo {
    FTUsrName: string;
    FTBchCode: string;
    FTAgnCode: string;
    FTMerCode: string;
    FTUsrLogin: string;
    FTUsrPass: string;  
    FTUsrCode: string;  
  }

  export interface SysConfig {
    FTSysCode: string;
    FTSysStaUsrValue: string;
  }