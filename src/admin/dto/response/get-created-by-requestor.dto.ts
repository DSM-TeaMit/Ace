export interface GetCreatedByRequestorDto {
  count: number;
  accounts: Account[];
}

interface Account {
  uuid: string;
  uid: string;
  name: string;
}
