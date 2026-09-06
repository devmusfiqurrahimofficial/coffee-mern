
const FooterColumn = ({ title, links }) => {
  return (
    <div>
       <h3 className=" text-xl font-bold font-sans">{title}</h3>

      <ul className="mt-8 space-y-3 text-sm text-zinc-200 ">
        {links.map((link) => (
          <li key={link}>
            <a href="#" className="transition hover:text-lime-400">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FooterColumn
