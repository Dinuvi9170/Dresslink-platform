import React from "react";
import { Link } from "react-router-dom";
import "./supplierCard.css";

const SupplierCard = ({ supplier }) => {
    console.log("Supplier data in card:", supplier);
    return (
        <div className="supplierCard">
            <Link to={`/suppliers/${supplier._id}`} className="supplierCard__link">
            <div className="supplierCard-container">
                <div className="supplierCard__picture">
                    <img src={supplier.cover} alt={supplier.cover} className="supplierCard__image" />
                </div>
                <div className="supplierCard__details">
                    <h2 className="shop__name">{supplier.ShopName}</h2>
                    <p className="shop__title">{supplier.title}</p>
                    <p className="shop__address">{supplier.address}</p>
                    <div className="supplierCard-user">
                        <img src={supplier.user_img} alt={supplier.username} className="gigCard__user-image" />
                        <p className='text2'>Created by</p>
                        <p className="gigCards__username">{supplier.username}</p>
                    </div>
                </div>
            </div>
            </Link>
        </div>
    );
}
export default SupplierCard;
