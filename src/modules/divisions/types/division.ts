export interface DivisionPm {
  id: string;
  name: string | null;
  email: string;
}

/** Divisi (mis. MKK, MLSC): wadah proyek. */
export interface Division {
  id: string;
  name: string;
  projectCount: number;
  /** User yang meminta boleh membuat/memindahkan proyek ke divisi ini (Root, atau PM divisi ini). */
  canCreateProject: boolean;
  /** PM divisi; hanya diisi untuk Root (halaman Divisi). */
  pms: DivisionPm[];
}
