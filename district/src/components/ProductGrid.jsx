import ProductCard from './ProductCard';

export default function ProductGrid({ title, accent, products, id }) {
  return (
    <div className="section" id={id}>
      <div className="section-header">
        <h2 className="section-title">
          {title} <span>{accent}</span>
        </h2>
        <a href="#" className="section-link">View All</a>
      </div>
      <div className="product-grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
