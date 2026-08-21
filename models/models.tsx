export interface Product {
    FNId: number;
    FTBarcode: string;
    FCCost: number;
    FNQuantity: number;
    FTRefDoc: string;
    FTRefSeq: string;
    FTXthDocKey: string;
    FTBchCode: string;
    FTAgnCode: string;
    FTUsrName: string;
    FDCreateOn: string;
    FTPORef: string;
    FTMobileRefDoc?: string;
}

export interface History {
    FTDate: string;
    FTRefDoc: string;
    FNStatus: number;
    FTRefSeq: string;
    FTMobileRefDoc?: string;
}

export interface UserInfo {
    FTUsrName: string;
    FTBchCode: string;
    FTBchName: string,
    FTAgnCode: string;
    FTAgnName: string
    FTMerCode: string;
    FTStaHasGroup?: string;
    FTUsrLogin: string;
    FTUsrLoginPwd: string | null;
    FTUsrCode: string;  
    FTImgObj: string | null;
  }

  export interface SysConfig {
    FTSysCode: string;
    FTSysStaUsrValue: string;
  }

  
  export interface BranchInfo {
    FTBchCode: string;
    FTBchName: string;
  }
