
export interface Product {
    FNId: number;
    FTBarcode: string;
    FCCost: number;
    FNQuantity: number;
    FTRefDoc: string;
}

export interface History {
    FTDate: string;
    FTRefDoc: string;
    FNStatus: number;
}

export interface UserInfo {
    FTUsrName: string;
    FTBchCode: string;
    FTAgnCode: string;
    FTMerCode: string;
  }