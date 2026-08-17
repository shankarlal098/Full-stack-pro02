const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo")

const createProblem = async (req,res)=>{
   
  // API request to authenticate user:
    const {title,description,difficulty,tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution, problemCreator
    } = req.body;


    try{    console.log("121");
    const userProblem =  await Problem.create({
        ...req.body,
        problemCreator: req.result._id
      });

      res.status(201).send("Problem Saved Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}




const updateProblem = async (req,res)=>{
    
  const {id} = req.params;
  const {title,description,difficulty,tags,
    visibleTestCases,hiddenTestCases,startCode,
    referenceSolution, problemCreator
   } = req.body;

  try{

     if(!id){
      return res.status(400).send("Missing ID Field");
     }

    const DsaProblem =  await Problem.findById(id);
    if(!DsaProblem)
    {
      return res.status(404).send("ID is not persent in server");
    }
      
    for(const {language,completeCode} of referenceSolution){
         


      const languageId = getLanguageById(language);
        
      // I am creating Batch submission
      const submissions = visibleTestCases.map((testcase)=>({
          source_code:completeCode,
          language_id: languageId,
          stdin: testcase.input,
          expected_output: testcase.output
      }));


      const submitResult = await submitBatch(submissions);
      // console.log(submitResult);

      const resultToken = submitResult.map((value)=> value.token);

      // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
      
     const testResult = await submitToken(resultToken);

    //  console.log(testResult);

     for(const test of testResult){
      if(test.status_id!=3){
       return res.status(400).send("Error Occured");
      }
     }

    }


  const newProblem = await Problem.findByIdAndUpdate(id , {...req.body}, {runValidators:true, new:true});
   
  res.status(200).send(newProblem);
  }
  catch(err){
      res.status(500).send("Error: "+err);
  }
}
const deleteProblem = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

   const deletedProblem = await Problem.findByIdAndDelete(id);

   if(!deletedProblem)
    return res.status(404).send("Problem is Missing");


   res.status(200).send("Successfully Deleted");
  }
  catch(err){
     
    res.status(500).send("Error: "+err);
  }
}
const getProblemById = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

    const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution ');
   
    // video ka jo bhi url wagera le aao

   if(!getProblem)
    return res.status(404).send("Problem is Missing");

   const videos = await SolutionVideo.findOne({problemId:id});

   if(videos){   
    
   const responseData = {
    ...getProblem.toObject(),
    secureUrl:videos.secureUrl,
    thumbnailUrl : videos.thumbnailUrl,
    duration : videos.duration,
   } 
  
   return res.status(200).send(responseData);
   }
    
   res.status(200).send(getProblem);

  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}
const getAllProblem = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const queryObject = {};

    // Agar frontend se specific difficulty aayi (and 'all' nahi hai)
    if (req.query.difficulty && req.query.difficulty !== 'all') {
      queryObject.difficulty = req.query.difficulty; // e.g., 'easy', 'medium', 'hard'
    }

    if (req.query.tag && req.query.tag !== 'all') {
      queryObject.tags = req.query.tag; // e.g., 'array', 'dp'
    }

    // 2. Count aur Find dono mein queryObject pass karo
    const totalProblems = await Problem.countDocuments(queryObject);

    const problems = await Problem.find(queryObject)
      .select('_id title difficulty tags')
      .skip(skip)
      .limit(limit);

    if (problems.length === 0) {
      // Empty array bhejna status 404 ke badle zyada sahi hai filter ke case mein
      return res.status(200).json({ data: [], meta: { totalProblems: 0, currentPage: page, totalPages: 0 } });
    }

    res.status(200).json({
      success: true,
      data: problems,
      meta: {
        totalProblems,
        currentPage: page,
        totalPages: Math.ceil(totalProblems / limit),
        limit
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
};







const solvedAllProblembyUser =  async(req,res)=>{
   
    try{
       
      const userId = req.result._id;

      const user =  await User.findById(userId).populate({
        path:"problemSolved",
        select:"_id title difficulty tags"
      });
      
      return res.status(200).send(user.problemSolved);

    }
    catch(err){
      res.status(500).send("Server Error");
    }
}
const submittedProblem = async (req, res) => {
  try {
    const userId = req.result._id; 
  
    const problemId = req.params.problemId || req.params.pid;

    const ans = await Submission.find({ userId, problemId });
  
    if (!ans || ans.length === 0) {
      return res.status(200).json([]); 
    }
    return res.status(200).json(ans);

  } catch (err) {
    console.error("Error in submittedProblem controller:", err);
    return res.status(500).send("Internal Server Error");
  }
};
const getUserProfile = async (req, res) => {
  try {
    // 1. User ki details req.result se nikaali
    const userId = req.result._id;
    const user = await User.findById(userId).select("-password"); // Password chhod kar sab le lo

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2. Total Submissions count karo (Passed + Failed sab)
    const totalSubmissions = await Submission.countDocuments({ userId });

    // 3. Status Breakdown nikalo 
    const acceptedCount = user.problemSolved ? user.problemSolved.length : 0; // Safe check lagaya array ke liye
    const wrongAnswers = await Submission.countDocuments({ userId, status: "wrong" });
    const runtimeErrors = await Submission.countDocuments({ userId, status: "error" });

    // 4. Recent 5 Submissions nikal lo
    const recentSubmissions = await Submission.find({ userId })
      .sort({ createdAt: -1 }) // Latest sabse upar
      .limit(5)
      .populate("problemId", "title");

    // 5. Response bhejo frontend ko
    return res.status(200).json({
      success: true,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        // Frontend 'emailId' dhoond raha hai tumhari file me, toh emailId naam se hi bhej dete hain
        emailId: user.emailId || user.email, 
        role: user.role,
        createdAt: user.createdAt,
        profilePic: user.profilePic || "", // Profile picture safe check ke sath
        
        //  NAYE FIELDS JO FRONTEND KO CHAHIYE:
        bio: user.bio || "",
        phone: user.phone || "",
        location: user.location || "",
        gender: user.gender || "",
        githubProfile: user.githubProfile || "",
        linkedinProfile: user.linkedinProfile || "",
        
        problemsSolvedCount: acceptedCount
      },
      stats: {
        totalSubmissions,
        wrongAnswers,
        runtimeErrors,
        accuracy: totalSubmissions > 0 ? Math.round((acceptedCount / totalSubmissions) * 100) : 0
      },
      recentSubmissions
    });

  } catch (err) {
    console.error("Profile Fetch Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem , getUserProfile};



// logfin sigup se login nhi lo rha tha bhai or dirrect user me token bhi nhi cl rha tha referseh karke pr token nhi bta rha tha 
