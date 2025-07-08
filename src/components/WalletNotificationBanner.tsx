
import React, { useState, useEffect } from 'react';

const withdrawalMessages = [
  "📢 Joy from Abuja just withdrew ₦40,000",
  "📢 Samuel from Lagos just withdrew ₦105,000",
  "📢 Ada from Enugu just withdrew ₦200,000",
  "📢 Chinedu from Owerri just withdrew ₦80,000",
  "📢 Zainab from Kaduna just withdrew ₦130,000",
  "📢 Femi from Ibadan just withdrew ₦45,000",
  "📢 Uche from Onitsha just withdrew ₦150,000",
  "📢 Aisha from Kano just withdrew ₦60,000",
  "📢 Blessing from Benin just withdrew ₦90,000",
  "📢 Tolu from Abeokuta just withdrew ₦70,000",
  "📢 Henry from Port Harcourt just withdrew ₦160,000",
  "📢 Vivian from Asaba just withdrew ₦50,000",
  "📢 Ibrahim from Jos just withdrew ₦85,000",
  "📢 Ruth from Warri just withdrew ₦30,000",
  "📢 Emmanuel from Uyo just withdrew ₦95,000",
  "📢 Chiamaka from Nsukka just withdrew ₦120,000",
  "📢 Sodiq from Ilorin just withdrew ₦200,000",
  "📢 Ngozi from Awka just withdrew ₦35,000",
  "📢 Musa from Gombe just withdrew ₦110,000",
  "📢 Ifeanyi from Calabar just withdrew ₦75,000",
  "📢 Grace from Lafia just withdrew ₦100,000",
  "📢 David from Ado-Ekiti just withdrew ₦140,000",
  "📢 Esther from Yenagoa just withdrew ₦155,000",
  "📢 John from Makurdi just withdrew ₦180,000",
  "📢 Victoria from Minna just withdrew ₦65,000"
];

const WalletNotificationBanner: React.FC = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => 
        (prevIndex + 1) % withdrawalMessages.length
      );
    }, 5000); // Change message every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-blue-600 text-white py-2 px-4 text-sm font-medium text-center overflow-hidden">
      <div className="animate-pulse">
        {withdrawalMessages[currentMessageIndex]}
      </div>
    </div>
  );
};

export default WalletNotificationBanner;
