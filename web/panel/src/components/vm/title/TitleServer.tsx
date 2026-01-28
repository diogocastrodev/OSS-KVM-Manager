interface props{
    name: string
    publicId: number
}


export default function VMTitleServer(props: props) {
    console.log(props)
  return (
    <>
        <div>{props.name}({props.publicId})</div>
    </>
  );
}
