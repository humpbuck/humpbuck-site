declare module "zipcodes" {
  export interface ZipCode {
    zip: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
  }

  const zipcodes: {
    lookup: (zip: string) => ZipCode | undefined;
    lookupByState: (state: string) => ZipCode[];
    states: {
      normalize: (state: string) => string;
    };
  };
  export default zipcodes;
}
