interface props {
  name: string;
  publicId: number;
}

export default function VMTitle(props: props) {
  console.log(props);
  return (
    <>
      <div className="text-xl font-semibold">
        {props.name}
        <span className="pl-1 text-xs font-extralight">({props.publicId})</span>
      </div>
    </>
  );
}
