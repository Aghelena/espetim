import logo from "../assets/logo.jpg";

// Marca do Espetim do Nin. `size` controla o tamanho (px); use "brand-logo-sm"
// via className para o tamanho compacto usado nas barras de topo.
export default function Logo({ size = 40, className = "", alt = "Espetim do Nin" }) {
  return (
    <img
      src={logo}
      alt={alt}
      className={"brand-logo " + className}
      style={{ width: size, height: size }}
    />
  );
}
