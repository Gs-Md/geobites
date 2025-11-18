import React from 'react'
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import "../styles/Footer.css";
 const Footer = () => { return (
<div className="footer">
<div className="socialMedia">
<InstagramIcon /> <TwitterIcon /> <FacebookIcon /> <LinkedInIcon />
</div>
<p> &copy; 2025 Lebanese International University </p> </div>
) }
export default Footer