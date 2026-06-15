import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const CategoryItems = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, "categories"));
      const catList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(catList);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return <p className="text-center mt-10 text-gray-500">Loading categories...</p>;
  }

  const handleCategoryClick = (categoryName) => {
    navigate("/category", { state: { selectedCategory: categoryName } });
  };

  return (
    <div className=" py-7 px-6">
      <h2 className="text-2xl md:text-4xl font-extrabold text-black text-center bg-gradient-to-r from-secondary to-primary bg-clip-text  mb-10 pb-5 tracking-wide">
        Explore Our Categories
      </h2>

      {categories.length === 0 ? (
        <p className="text-gray-500 text-center text-lg">No categories available.</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-10">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.cname)}
              className="group relative cursor-pointer flex flex-col items-center transition-transform hover:scale-105"
            >

              <div className="relative w-45 h-45 md:w-50 md:h-50 rounded-full border-[6px] border-secondary group-hover:border-primary overflow-hidden shadow-lg hover:shadow-secondary transition-all duration-500">
                  <img
                    src={cat.cimgs[0]}
                    alt={cat.cname}
                    className="w-full h-full  p-2 object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                  />
              </div>

              <p 
              onClick={() => handleCategoryClick(cat.cname)}    
              className="mt-4 text-lg md:text-xl font-semibold text-gray-800 group-hover:text-primary transition-colors duration-300">
                {cat.cname}
              </p>

              <div className="h-[2px] w-0 bg-gradient-to-r from-secondary to-primary mt-2 rounded-full group-hover:w-16 transition-all duration-500"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryItems;