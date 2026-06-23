export type SiteFabPopoverCoordination = {
  menuId: string;
  openMenu: string | null;
  onOpenMenuChange: (id: string | null) => void;
};
