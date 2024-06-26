{ pkgs }: {
	deps = [
    pkgs.nodejs-18_x
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.nss
    pkgs.replitPackages.jest
    pkgs.freetype
    pkgs.fontconfig
     pkgs.chromium
    pkgs.pango
    pkgs.cairo
	];
}