
export default async function Page() {
  // memory container holding raw binary data that i cant read write to it
  const arrayBuffer=new ArrayBuffer(8)
  console.log(arrayBuffer)
  // I need to create a view to read and write
  const view= new Uint8Array(arrayBuffer)
  // let start modifying it 

  view[0]=1,
  view[1]=2

  console.log(view)

  // Now lets add some metadata to this binary data
  const blob=new Blob(view,{type:"plain/text"})
  console.log(blob)

  // Blob is not directly readable lets convert it first 
  const blobData=await blob.text() // new method previously we used to do fileReader stuff
  console.log( blobData)
  
  // Now lets add some more metadata
  const file=new File(view,"demo.txt") // file is also basically a blob but with more metadata
  console.log(file)

  // Now lets move to where it all started ArrayBuffer
  const originalArrayBuffer=await blob.arrayBuffer()
  console.log(originalArrayBuffer)
  return (
    <div>Page</div>
  )
}
