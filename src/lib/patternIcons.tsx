import React from "react";
import { AlertTriangle, Heart, Shield, Eye, Users, MessageCircle, Zap } from "lucide-react";

export const PATTERN_ICONS: Record<string, React.ReactNode> = {
  emotional_invalidation: <MessageCircle className="w-5 h-5" />,
  benevolent_sexism: <Heart className="w-5 h-5" />,
  gender_role_expectation: <Users className="w-5 h-5" />,
  objectification: <Eye className="w-5 h-5" />,
  harassment: <AlertTriangle className="w-5 h-5" />,
  public_intimidation: <Zap className="w-5 h-5" />,
  safety_threat: <Shield className="w-5 h-5" />,
};
