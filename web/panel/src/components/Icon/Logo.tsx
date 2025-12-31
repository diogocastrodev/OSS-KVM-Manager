interface LogoProps {
  props?: React.ImgHTMLAttributes<HTMLImageElement>;
}

export default function Logo({ props }: LogoProps) {
  // I've the logo in /public/logo.svg
  return <img src="/logo_orange_glow.png" alt="Serverseer Logo" {...props} />;
}
