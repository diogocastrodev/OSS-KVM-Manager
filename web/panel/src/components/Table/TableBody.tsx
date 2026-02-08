interface props {
  children: React.ReactNode;
}

export default function TableBody({ children }: props) {
  return <tbody>{children}</tbody>;
}
