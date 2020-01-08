<?php

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.


defined('MOODLE_INTERNAL') || die();

// This class looks for text including markup and
// applies tidy's repair function to it.
// Tidy is a HTML clean and
// repair utility, which is currently available for PHP 4.3.x and PHP 5 as a
// PECL extension from http://pecl.php.net/package/tidy, in PHP 5 you need only
// to compile using the --with-tidy option.
// If you don't have the tidy extension installed or don't know, you can enable
// or disable this filter, it just won't have any effect.
// If you want to know what you can set in $tidyoptions and what their default
// values are, see http://php.net/manual/en/function.tidy-get-config.php.

class filter_viewermecaobj extends moodle_text_filter {
    
    public $page;
    public $incr = 1;
    public function setup($page, $context) {
        $this->context = $context;
        $this->page = $page;
        $this->incr++;
         // This only requires execution once per request.
        static $jsinitialised = false;
        if ($jsinitialised) {
            return;
        }
        $jsinitialised = true;
        
    }
    
    function filter($text, array $options = array()) {
        
        //select file to display
        $text_origin = $text;
        $elem_to_replace = array();
        
        $list_ext = array(".stl",".STL");
        foreach ($list_ext as $le) {
            $text = $text_origin;
            $output = "";
            $begin = 0;
            $end = strpos($text,$le)+4;
            while (strpos($text,$le) == true) {

                if (strrchr(substr($text, $begin, $end), " ") != null)
                {
                    $pre_url = strrchr(substr($text, $begin, $end), " ");
                } else {
                    $pre_url = substr($text, $begin, $end);
                }

                while (strpos($pre_url,">") !== false || mb_stripos($pre_url,";") !== false) {
                    if (strpos($pre_url,">") > strpos($pre_url,";")) {
                        $begin = strpos($pre_url,">")+1;        
                    } elseif (strpos($pre_url,">") != mb_stripos($pre_url,";")){
                        $begin = mb_stripos($pre_url,";")+1; 
                    } else {
                        $begin = 1;
                    }

                    $pre_url = substr($pre_url, $begin);
                    $begin = 0;
                }

                   if(substr($pre_url,0,6) != " href=" && substr($pre_url,0,6) != "href=") {
                       $elem_to_replace[] = $pre_url;
                    }


                $text = substr($text,strpos($text,$le)+4);
                $end = strpos($text,$le)+4;
            }
        }
        
        if (!empty($elem_to_replace)) {
            
            $elem_to_replace_with_name = array();
            
            foreach ($elem_to_replace as $id => $elem) {              
                $patterns = array();
                $replacements = array();
                $replacements[0] = "viwer_stl_".$id;
                $patterns[0] = '~<a\s[^>]*href="*"[^>]*>([^>]*)'.$elem.'</a>~';
                
                if(preg_match($patterns[0], $text_origin)) {
                    
                    $text_origin = preg_replace($patterns, $replacements, $text_origin,1);
                } else {
                    $patterns[0] = '~'.$elem.'~';
                    $text_origin = preg_replace($patterns, $replacements, $text_origin,1);
                }
                
                $elem_to_replace_with_name[$id]["name"] = $replacements[0];
                $elem_to_replace_with_name[$id]["url"] = $elem;
            }
            
            $all_url = array();
            foreach ($elem_to_replace_with_name as $id => $elem) {
                
                 
                $replace_code ='
                 <div id="mainwrap_canvas_'.($id+1)."_".$this->context->id.'_'.$this->incr.'" style="text-align:center;margin:0 auto;">
                    <div id="canvas_container_'.($id+1)."_".$this->context->id.'_'.$this->incr.'" style="position: relative; border: 1px dashed rgb(0, 0, 0); background: rgb(238, 238, 238); display: inline-block; width: 464px; height: 464px;">
                        <span id="loading_'.($id+1)."_".$this->context->id.'_'.$this->incr.'" style="top:50%; position:relative;"> </span>
                    </div>  
                    <div>
                            <a  href="javascript:void(0)" onclick="controls.forEach(function(element) { if (\'canvas_container_'.($id+1)."_".$this->context->id.'_'.$this->incr.'\'== element.ident) { element.autoRotate = !element.autoRotate;}});">'.get_string('rotation', 'filter_viewermecaobj').'</a> /
                            <a  href="'.$elem_to_replace_with_name[$id]["url"].'">'.get_string('download', 'filter_viewermecaobj').'</a>
                    </div>
                </div>';
                
                $all_url[] = $elem_to_replace_with_name[$id]["url"];
                $text_origin = str_replace($elem_to_replace_with_name[$id]["name"], $replace_code, $text_origin);
            }

            $this->page->requires->js_call_amd('filter_viewermecaobj/building_scene', 'init',array($all_url, $this->context->id, sizeof($elem_to_replace_with_name),$this->incr));
        } 
        
        //include here to remove error 
        return $text_origin;
    }
}

