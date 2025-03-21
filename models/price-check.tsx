export interface Price {
  rtPdtCode: string;
  rtPghDocNo: string;
  rtPghDocType: string;
  rtPunCode: string;
  rcPrice: number;
  rtPplCode: string;
  rtPplName: string | null;
  rdPghDStart: string;
  rdPghDStop: string;
  rtPghTStart: string;
  rtPghTStop: string;
}

export interface Promotion {
  rtBchCode: string;
  rtPmhDocNo: string;
  rtPdtCode: string;
  rtPunCode: string;
  rdPmhDStart: string;
  rdPmhTStart: string;
  rdPmhDStop: string;
  rdPmhTStop: string;
  rtPplCode: string;
  rtPmhName: string;
}

export interface ProductData {
  rtPdtCode: string;
  rtPdtName: string;
  aoPdtBar: {
    rtPdtCode: string;
    ptBarCode: string;
    rtPunCode: string;
    rtPunName: string;
    rcUnitFact: number;
  }[];
  aoPdtStk: {
    rtPdtCode: string;
    rtBchCode: string;
    rtWahCode: string;
    rcStkQty: number;
    rtWahName: string;
  }[];
  aoPdtPmt: Promotion[];
  aoPdtPrice: Price[];
}